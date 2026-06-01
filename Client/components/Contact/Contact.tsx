import React from 'react'
import ContactForm from './ContactForm'

const Contact = () => {
  return (
    <div className='border-t-[1px]'>
        <div className="container mx-auto px-4 py-8 w-[80%] border-[1px] rounded-xl mt-5">
            <h1 className="text-4xl font-bold border-b-[1px] border-gray-300 pb-2 mb-8">Liên hệ với chúng tôi</h1>

            <section className="mb-8">
                <p className='max-w-[1000px]'>Chúng tôi luôn sẵn sàng hỗ trợ! Tại [Tên website thương mại điện tử], chúng tôi coi trọng giao tiếp cởi mở và cam kết mang đến dịch vụ tốt nhất cho bạn. Dù bạn có câu hỏi, cần hỗ trợ hay muốn góp ý, hãy liên hệ với chúng tôi.</p>
            </section>

            <section className="mb-8 flex flex-col gap-5">
                <h2 className="text-2xl font-semibold mb-2">Cách liên hệ với chúng tôi</h2>
                <div>
                    <h3 className="text-xl font-semibold mb-1">Hỗ trợ khách hàng:</h3>
                    <p className='max-w-[1000px]'>Đội ngũ hỗ trợ khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn. Bạn có thể liên hệ qua các cách sau:</p>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-1">Email:</h4>
                    <p>For general inquiries, order status, and support:
                        <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a>
                    </p>
                    <p>For returns and refunds:
                        <a href="mailto:returns@yourwebsite.com" className="text-blue-500">returns@yourwebsite.com</a>
                    </p>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-1">Mạng xã hội:</h4>
                    <p className='max-w-[1000px]'>Kết nối với chúng tôi trên mạng xã hội để nhận cập nhật, khuyến mãi và hỗ trợ mới nhất:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li><a href="https://www.facebook.com/yourpage" className="text-blue-500" target="_blank">Facebook</a></li>
                        <li><a href="https://www.twitter.com/yourhandle" className="text-blue-500" target="_blank">Twitter</a></li>
                        <li><a href="https://www.instagram.com/yourhandle" className="text-blue-500" target="_blank">Instagram</a></li>
                    </ul>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Câu hỏi thường gặp (FAQ)</h2>
                <p>For quick answers to common questions, visit our <a href="#" className="text-blue-500">FAQ</a> page. You might find the information you need without waiting for a response.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Góp ý</h2>
                <p className='max-w-[1000px]'>We are always looking for ways to improve and would love to hear your thoughts. Whether it’s about our products, services, or website, your feedback is invaluable to us. Please send your comments and suggestions to <a href="mailto:feedback@yourwebsite.com" className="text-blue-500">feedback@yourwebsite.com</a>.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Trung tâm trợ giúp</h2>
                <p className='max-w-[1000px]'>Explore our <a href="#" className="text-blue-500">Trung tâm trợ giúp</a> để xem hướng dẫn chi tiết, mẹo xử lý lỗi và cách theo dõi đơn hàng.</p>
            </section>
            <p>Cảm ơn bạn đã lựa chọn [Tên website thương mại điện tử]. Chúng tôi rất mong được hỗ trợ bạn!</p>
        </div>
        <ContactForm/>
    </div>
  )
}

export default Contact