import React from 'react'
import { footerCategories, footerSections } from '@/app/data'
import Link from 'next/link'
const Footer = () => {
  return (
    <div className='bg-flower-50  w-screen flex flex-col'>
        <div className='flex flex-col lg:flex-row justify-between items-center border-b-[1px] border-b-silver mt-16 pb-10 px-6 gap-6'>
            <div className='flex flex-col items-center text-center w-full lg:w-1/2'>
                <p className='text-salmon font-semibold text-lg mb-2'>GET OUR UPDATES</p>
                <p className='text-silver text-sm mb-4'>
                Subscribe to receive updates, access to exclusive deals, and more.
                </p>

                <div className='flex w-full max-w-[400px]'>
                <input
                    type='email'
                    placeholder='Enter your email...'
                    className='flex-1 px-4 py-2 border-b border-silver-200 outline-none bg-inherit'
                />
                <button className='bg-salmon text-white ml-2 px-4 py-2 rounded-md hover:bg-red-500 focus:outline-none'>
                    SUBSCRIBE
                </button>
                </div>
            </div>

            <div className='flex flex-col items-center justify-center text-center w-full lg:w-1/2'>
                <p className='text-salmon font-semibold text-lg mb-4'>FOLLOW US</p>
                
                <div className='flex gap-4 text-[30px]'>
                <a href="#" className='text-silver hover:text-blue-600'>
                    <i className="fa-brands fa-facebook"></i>
                </a>
                <a href="#" className='text-silver hover:text-sky-400'>
                    <i className="fa-brands fa-twitter"></i>
                </a>
                <a href="#" className='text-silver hover:text-pink-500'>
                    <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" className='text-silver hover:text-blue-700'>
                    <i className="fa-brands fa-linkedin"></i>
                </a>
                </div>
            </div>

            </div>
        <div className='relative flex flex-row pb-14 gap-10 flex-wrap border-b-[1px] justify-evenly border-b-silver'>
            {footerSections.map((each,index)=>
                <div key={index} className='flex flex-col'>
                    <p className='text-black mt-16 font-bold text-md tracking-wide mb-1'>{each.sectionName}</p>
                    <span className='border-b-[1px] w-16 border-b-salmon mb-6'></span>
                    <div className='gap-2 flex flex-col'>
                        {each.items.map((each1,index)=>
                            <Link href={each1.link} key={index} className='text-silver hover:text-salmon'>{each1.title}</Link>
                        )}
                    </div>
                </div>
            )}
        </div>
        <div className='w-[100%] h-50  gap-2 flex flex-col items-center mt-4 mb-16 lg:mb-0'>
            <img height={50} src='https://codewithsadee.github.io/anon-ecommerce-website/assets/images/payment.png'/>
            <p className='text-silver font-semibold tracking-[2px] lg:pb-0'>Copyright &copy; Anon All Rights Reserved.</p>
        </div>
    </div>
  )
}

export default Footer