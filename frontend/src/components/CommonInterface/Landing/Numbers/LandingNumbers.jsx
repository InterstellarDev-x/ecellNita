import React from 'react'
import './LandingNumbers.css'
import { useQuery } from '@tanstack/react-query'
import { apiConnector } from '../../../../utils/Apiconnecter'
import { authroutes } from '../../../../apis/apis'

function LandingNumbers() {
  const statsQuery = useQuery({
    queryKey: ['marketplace-public-stats'],
    queryFn: async () => {
      const response = await apiConnector('GET', authroutes.MARKETPLACE_STATS)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
  const stats = statsQuery.data
  const display = (value) => statsQuery.isLoading ? '…' : Number.isFinite(value) ? value.toLocaleString('en-IN') : '—'
  return (
    <div className='landing-numbers'>
        <div>
            <div className='landing-numbers-element'>
                <p className='landing-numbers-element-number'>{display(stats?.members)}</p>
                <p className='landing-numbers-element-subject'>Student Members</p>
                <div className='landing-numbers-element-underline'></div>
            </div>
            <div className='landing-numbers-element'>
                <p className='landing-numbers-element-number'>{display(stats?.products)}</p>
                <p className='landing-numbers-element-subject'>Products</p>
                <div className='landing-numbers-element-underline'></div>
            </div>
        </div>
        <div>
            <div className='landing-numbers-element'>
                <p className='landing-numbers-element-number'>{display(stats?.reviews)}</p>
                <p className='landing-numbers-element-subject'>Reviews</p>
                <div className='landing-numbers-element-underline'></div>
            </div>
            <div className='landing-numbers-element'>
                <p className='landing-numbers-element-number'>{display(stats?.categories)}</p>
                <p className='landing-numbers-element-subject'>Categories</p>
                <div className='landing-numbers-element-underline'></div>
            </div>
        </div>
    </div>
  )
}

export default LandingNumbers
