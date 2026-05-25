"use client"
import Footer from '@/components/Footer'
import React from 'react'
import dynamic from 'next/dynamic'
import Session from '../Session'

const Menubar = dynamic(() => import('@/components/Mobile-Interface/Menubar'), { ssr: false })
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })
const Cart = dynamic(() => import('../ProductUi/Cart'), { ssr: false })
const Favourite = dynamic(() => import('../ProductUi/Favourite'), { ssr: false })

interface ParentComponentProps {
  Component: React.ComponentType;
}

const Common: React.FC<ParentComponentProps> = ({Component}) => {
  return (
    <div className='overflow-x-hidden w-screen h-screen flex flex-col items-center'>
      <Session/>
      <Menubar/>
      <Cart/>
      <Favourite/>
      <Navbar/>
      <Component/>
      <Footer/>
    </div>
  )
}

export default Common