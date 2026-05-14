"use client"
import { currentEvent, featuresSec, testimonial } from '@/app/data'
import React, { useState } from 'react'

const Details = () => {
    const [hover, sethover] = useState<number | null>(null);
  return (
    <div className='flex w-full flex-wrap justify-center mt-5 gap-8'>
        <div>
            <p className='tracking-base text-xl font-semibold text-eblack border-b-[1px] pb-3 border-b-gray-200'>Authors</p>
            <div className='rounded-xl w-80 h-[375px] border-[1px] mt-8 flex justify-center items-center flex-col gap-4'>
                <img height={80} width={80} src={testimonial.imgLink} className=' rounded-full'/>
                <p className=' text-silver font-bold text-lg tracking-wide'>{testimonial.name} </p>
                <p className=' text-onyx'>{testimonial.position} </p>
                <img width={30} src='https://codewithsadee.github.io/anon-ecommerce-website/assets/images/icons/quotes.svg'/>
                <p className='w-[180px] text-center text-silver'>{testimonial.description} </p>
            </div>
        </div>
        <div className='w-[640px] h-[450px] relative rounded-xl justify-center items-center'>
            <img className='h-full w-full rounded-xl absolute' src='/images/banner.png'/>
        </div>
        <div>
            <p className='tracking-base text-xl font-semibold text-eblack border-b-[1px] pb-3 border-b-gray-200 tracking-wide'>Our Services</p>
            <div className='rounded-xl w-80 h-[375px] border-[1px] p-8 mt-8 flex justify-center flex-col gap-4'>
                {featuresSec.map((each,index)=>
                    <a key={index} href='/our-services' onMouseEnter={()=>sethover(index)} onMouseLeave={()=>sethover(null)} className='flex justify-start items-center gap-5'>
                    <div className='w-[40px] h-[40px] flex items-center'><i className={`${each.icon} ${hover==index ? 'text-black' : 'text-salmon'}`}></i></div>
                    <div>
                        <p className='font-semibold tracking-wide text-silver'>{each.title}</p>
                        <p className=' text-sm tracking-wide text-silver'>{each.description}</p>
                    </div>
                    </a>
                )}
            </div>
        </div>
    </div>
  )
}

export default Details