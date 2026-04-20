import Link from 'next/link'
import React,{useState} from 'react'
import { navBtns } from '@/app/data'
import Account from './DropdownMenu/Account';
import { useMenu } from '@/Helpers/MenuContext';
import Product from './DropdownMenu/Product';
import Category from './DropdownMenu/Category';
import { useRouter } from 'next/navigation'
import { HeartIcon,ShoppingBagIcon } from '@heroicons/react/24/outline';
const Navbar = () => {
    const router = useRouter()
    const socialMedia = ['facebook','twitter','instagram','linkedin'];
    const { toggleCart, toggleFav } = useMenu();
    const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
    const [selectIndex, setselectIndex] = useState<number | null>(null);
    function searchRedirect(e:any){
        e.preventDefault();
        router.push(`/search/${(e.target.searchEntry.value.split(' ').join('-'))}`)
    }
    return (
    <nav className='w-full h-auto flex flex-col items-center'>
        <div className='bg-flower-100 h-[50px] w-[100%] justify-evenly items-center border-b-[1px] hidden sm:flex'>
            <div className='flex w-[80%] justify-between'>
                <div className='flex gap-2'>
                    {socialMedia.map((each,index)=>
                        <button key={index} className='text-[16px] text-silver bg-gray-200 w-[25px] rounded-md hover:bg-blueIn hover:text-white'><i className={`fa-brands fa-${each}`}></i></button>
                    )}
                    
                </div>
                <div>
                    <p className='text-sm text-white'>FREE SHIPPING THIS WEEK ORDER OVER - 500K</p>
                </div>
                <div>
                    <p className='text-[18px] hidden sm:block text-sm font-medium text-white'>Shop Now</p>
                </div>
            </div>
        </div>
        <div className='w-[100%] h-auto flex flex-col justify-between items-center bg-flower-50'>
            <div className='flex justify-evenly items-center w-[100%] flex-col sm:flex-row gap-2 sm:gap-0'>
                <div className='w-[80%] flex justify-between items-center flex-col sm:flex-row sm:gap-0'>
                    <div>
                        <Link className='mr-2.5 text-[26px] text-flower-150 font-bold' href={"/"}><span className='text-[36px]'>3TL</span>-Store</Link>
                    </div>
                    <form onSubmit={searchRedirect} className='border-[1.5px] rounded-[10px] h-[42px] w-[90%] sm:w-[600px] mb-5 sm:mb-0 flex justify-between items-center'>
                        <input name='searchEntry' placeholder='Enter your product name...' type='text' className='outline-0 ml-5 text-[15px] w-[90%] placeholder:text-base placeholder:text-silver bg-inherit focus:outline-none '/>
                        <button type='submit' className='text-[16px] mr-4'><i className="fa-solid fa-magnifying-glass"></i></button>
                    </form>
                    <div className='gap-5 text-davysilver my-8 hidden sm:flex sm:items-center'>
                        {/* <button><i className="fa-regular fa-user fa-xl"></i></button> */}
                        <Account/>
                        <button onClick={toggleFav}><HeartIcon width={30}/></button>
                        <button onClick={toggleCart}><ShoppingBagIcon width={30}/></button>
                    </div>
                </div>
            </div>
        </div>
        <div className='h-[50px] w-[100%] justify-center items-center mb-4 hidden lg:flex bg-flower-50'>
            <div className='flex'>
                {navBtns.map((btn,index)=>
                <div key={index} onMouseEnter={()=>{setDropdownVisible(true);setselectIndex(index)}} onMouseLeave={()=>{setDropdownVisible(false);setselectIndex(null)}} className="relative items-center">
                    <button onClick={() => router.push(btn.catLink)} key={index} className='button-with-border text-[15px] m-6 text-[#9B9797] font-body tracking-wide hover:text-salmon'>{btn.name.toUpperCase()}</button>
                    {selectIndex === index && isDropdownVisible && btn.name==='Categories' && (<Category/>)}
                    {selectIndex === index && btn.isExtendable && isDropdownVisible && (
                    <Product options={btn.extendables} />
                    )}
                </div>
                )}
            </div>
        </div>
    </nav>
  )
};

export default Navbar