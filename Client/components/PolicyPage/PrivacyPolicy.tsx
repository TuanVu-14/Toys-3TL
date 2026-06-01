import React from 'react'

const PrivacyPolicy = () => {
  return (
    <div className='flex justify-center border-t-[1px]'>
      <div className="container mx-auto px-4 py-8 w-[80%]">
        <h1 className="text-4xl font-bold border-b-2 border-gray-300 pb-2 mb-8">Chính sách bảo mật</h1>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">1. Giới thiệu</h2><p>Chúng tôi tôn trọng quyền riêng tư của bạn. Chính sách này giải thích cách website thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân khi bạn truy cập, tạo tài khoản hoặc mua hàng.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">2. Thông tin chúng tôi thu thập</h2><p>Chúng tôi có thể thu thập thông tin bạn cung cấp trực tiếp như họ tên, email, số điện thoại, địa chỉ giao hàng, thông tin đơn hàng và nội dung bạn gửi qua biểu mẫu liên hệ.</p><p>Một số thông tin kỹ thuật có thể được thu thập tự động, ví dụ địa chỉ IP, loại trình duyệt, thiết bị, thời gian truy cập và cách bạn tương tác với website.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">3. Cách chúng tôi sử dụng thông tin</h2><ul className="list-disc list-inside ml-4"><li>Xử lý đơn hàng, giao hàng và hỗ trợ thanh toán.</li><li>Quản lý tài khoản, xác thực đăng nhập và bảo mật hệ thống.</li><li>Gửi thông báo về đơn hàng, khuyến mãi hoặc cập nhật dịch vụ khi phù hợp.</li><li>Cải thiện trải nghiệm mua sắm và chất lượng hỗ trợ.</li><li>Phòng chống gian lận, xử lý vi phạm và tuân thủ yêu cầu pháp lý.</li></ul></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">4. Chia sẻ thông tin</h2><p>Chúng tôi không bán thông tin cá nhân của bạn. Thông tin có thể được chia sẻ với đơn vị vận chuyển, nhà cung cấp thanh toán, nhà cung cấp hạ tầng kỹ thuật hoặc cơ quan có thẩm quyền khi cần thiết để cung cấp dịch vụ và tuân thủ pháp luật.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">5. Cookie và công nghệ tương tự</h2><p>Website có thể sử dụng cookie để ghi nhớ tùy chọn, duy trì phiên đăng nhập, phân tích lưu lượng truy cập và cải thiện trải nghiệm. Bạn có thể điều chỉnh cookie trong cài đặt trình duyệt.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">6. Bảo mật dữ liệu</h2><p>Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân. Tuy nhiên, không có phương thức truyền tải hoặc lưu trữ điện tử nào an toàn tuyệt đối.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">7. Quyền của bạn</h2><p>Bạn có thể yêu cầu truy cập, chỉnh sửa, cập nhật hoặc xóa thông tin cá nhân theo quy định pháp luật. Bạn cũng có thể rút lại sự đồng ý nhận thông tin tiếp thị bất kỳ lúc nào.</p></section>
        <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">8. Liên hệ</h2><p>Nếu bạn có câu hỏi hoặc yêu cầu liên quan đến chính sách bảo mật, vui lòng liên hệ qua <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a>.</p></section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
