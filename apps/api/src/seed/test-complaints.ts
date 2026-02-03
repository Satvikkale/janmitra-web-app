import 'dotenv/config';
import mongoose from 'mongoose';
import { Org, OrgSchema } from '../orgs/orgs.schema';
import { Complaint, ComplaintSchema } from '../complaints/complaint.schema';
import { Society, SocietySchema } from '../societies/society.schema';

async function run() {
  const uri = process.env.MONGO_URI!;
  await mongoose.connect(uri);
  
  const OrgModel = mongoose.model(Org.name, OrgSchema);
  const ComplaintModel = mongoose.model(Complaint.name, ComplaintSchema);
  const SocietyModel = mongoose.model(Society.name, SocietySchema);

  // Get all verified NGOs
  const ngos = await OrgModel.find({ type: 'NGO', isVerified: true }).lean();
  console.log(`Found ${ngos.length} verified NGOs:`);
  ngos.forEach(ngo => {
    console.log(`  - ${ngo.name} (${ngo._id}): subtype=${ngo.subtype}, categories=${ngo.categories?.join(', ')}`);
    console.log(`    description: ${ngo.description?.substring(0, 100) || 'N/A'}`);
  });

  // Get or create a test society
  let society = await SocietyModel.findOne().lean();
  if (!society) {
    const created = await SocietyModel.create({
      name: 'Test Society',
      location: { lat: 28.6139, lng: 77.2090 },
    });
    society = created.toObject();
    console.log('\nCreated test society:', created.name);
  } else {
    console.log('\nUsing existing society:', society.name);
  }

  if (!society) {
    console.log('\nFailed to get or create society');
    process.exit(1);
  }

  // Get existing complaints
  const existingComplaints = await ComplaintModel.find().lean();
  console.log(`\nExisting complaints: ${existingComplaints.length}`);
  existingComplaints.forEach(c => {
    console.log(`  - ${c.category}: orgId=${c.orgId || 'NOT ASSIGNED'}, status=${c.status}`);
  });

  if (ngos.length === 0) {
    console.log('\nNo verified NGOs found. Please create and verify an NGO first.');
    process.exit(0);
  }

  // Create test complaints for each NGO based on their categories/description
  console.log('\nCreating test complaints...');
  
  for (const ngo of ngos) {
    // Create a complaint that matches this NGO's expertise
    const category = ngo.categories?.[0] || ngo.subtype || 'general';
    const description = `This is a test complaint about ${category}. We need help with ${ngo.subtype || 'issues in our area'}.`;
    
    const complaint = await ComplaintModel.create({
      reporterId: 'test-user-1',
      societyId: String(society._id),
      orgId: String(ngo._id), // Directly assign to this NGO
      category: category,
      description: description,
      status: 'open',
      priority: 'med',
    });
    
    console.log(`  Created complaint for ${ngo.name}: category=${category}, id=${complaint._id}`);
  }

  // Also reassign any unassigned complaints
  const unassigned = await ComplaintModel.find({ 
    $or: [{ orgId: null }, { orgId: { $exists: false } }, { orgId: '' }] 
  }).lean();
  
  console.log(`\nUnassigned complaints: ${unassigned.length}`);
  
  if (unassigned.length > 0 && ngos.length > 0) {
    // Assign to the first NGO for testing
    for (const complaint of unassigned) {
      await ComplaintModel.findByIdAndUpdate(complaint._id, { orgId: String(ngos[0]._id) });
      console.log(`  Assigned complaint ${complaint._id} to ${ngos[0].name}`);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
