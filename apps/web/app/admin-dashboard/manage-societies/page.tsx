'use client'

import React, { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

interface Society {
  _id: string
  name: string
  location?: {
    lat: number
    lng: number
  }
  headUserSub?: string
  createdAt: string
}

interface Member {
  _id: string
  societyId: string
  userSub: string
  userName: string
  userEmail?: string
  role: 'resident' | 'society_head'
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

export default function ManageSocieties() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoggedIn } = useAuth()
  const [expandedSociety, setExpandedSociety] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, Member[]>>({})
  const [membersLoading, setMembersLoading] = useState<string | null>(null)

  const fetchSocieties = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/societies')
      setSocieties(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching societies:', err)
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('You are not authorized to access this data. Please login as an admin user.')
      } else {
        setError('Failed to fetch societies. Please check your permissions and try again.')
      }
      setSocieties([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (societyId: string) => {
    try {
      setMembersLoading(societyId)
      const data = await apiFetch(`/societies/${societyId}/memberships`)
      setMembers(prev => ({ ...prev, [societyId]: data }))
    } catch (err: any) {
      console.error('Error fetching members:', err)
      setMembers(prev => ({ ...prev, [societyId]: [] }))
    } finally {
      setMembersLoading(null)
    }
  }

  const toggleExpand = (societyId: string) => {
    if (expandedSociety === societyId) {
      setExpandedSociety(null)
    } else {
      setExpandedSociety(societyId)
      if (!members[societyId]) {
        fetchMembers(societyId)
      }
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchSocieties()
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-white/50 max-w-sm w-full">
          <p className="text-gray-600 text-center text-sm sm:text-base">Please log in to view societies.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium text-sm sm:text-base">Loading societies...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 p-4 sm:p-8">
        <div className="max-w-md mx-auto bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4 sm:p-6">
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-3 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            Manage Societies
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm md:text-base">View and manage all registered societies</p>
        </div>

        {societies.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-12 md:p-16 text-center shadow-sm">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">No societies found.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:gap-5">
            {societies.map((society) => {
              const societyMembers = members[society._id] || []
              const approvedCount = societyMembers.filter(m => m.status === 'approved').length
              const pendingCount = societyMembers.filter(m => m.status === 'pending').length
              const isExpanded = expandedSociety === society._id

              return (
                <div
                  key={society._id}
                  className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div
                    className="p-3 sm:p-5 md:p-6 cursor-pointer active:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(society._id)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-lg md:text-xl">
                          {society.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 truncate">{society.name}</h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">
                          Created {new Date(society.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {members[society._id] && (
                          <div className="hidden sm:flex items-center gap-1.5 md:gap-2">
                            <span className="px-2 md:px-3 py-1 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap">
                              {approvedCount} members
                            </span>
                            {pendingCount > 0 && (
                              <span className="px-2 md:px-3 py-1 md:py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap">
                                {pendingCount} pending
                              </span>
                            )}
                          </div>
                        )}
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Mobile badges */}
                    {members[society._id] && (
                      <div className="flex sm:hidden items-center gap-1.5 mt-2.5 pl-[52px]">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                          {approvedCount} members
                        </span>
                        {pendingCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-3 sm:px-5 md:px-6 pb-3 sm:pb-5 md:pb-6">
                      <div className="pt-3 sm:pt-4 border-t border-gray-100">
                        {membersLoading === society._id ? (
                          <div className="flex items-center justify-center gap-3 py-6 sm:py-8">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 text-xs sm:text-sm">Loading members...</span>
                          </div>
                        ) : members[society._id]?.length === 0 ? (
                          <p className="text-gray-400 text-center py-6 sm:py-8 text-xs sm:text-sm">No members in this society.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {members[society._id]?.map((member) => (
                              <div
                                key={member._id}
                                className="bg-gray-50/80 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 flex items-center gap-2.5 sm:gap-3 md:gap-4"
                              >
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  member.role === 'society_head' 
                                    ? 'bg-gradient-to-br from-violet-400 to-violet-500' 
                                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                                }`}>
                                  <span className="text-white text-[10px] sm:text-xs md:text-sm font-semibold">
                                    {member.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 truncate text-xs sm:text-sm md:text-base">{member.userName}</p>
                                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 truncate">{member.userEmail || 'No email'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
                                  <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-semibold uppercase tracking-wide ${
                                    member.role === 'society_head' ? 'text-violet-600' : 'text-gray-500'
                                  }`}>
                                    {member.role.replace('_', ' ')}
                                  </span>
                                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                    member.status === 'approved' ? 'bg-emerald-400' :
                                    member.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                                  }`}></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}