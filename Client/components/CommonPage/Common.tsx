"use client"
import Footer from '@/components/Footer'
import Menubar from '@/components/Mobile-Interface/Menubar'
import Navbar from '@/components/Navbar'
import React from 'react'
import Cart from '../ProductUi/Cart'
import Favourite from '../ProductUi/Favourite'
import Session from '../Session'
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
