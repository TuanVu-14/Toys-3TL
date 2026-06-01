import React from 'react'

const RefundCancellation = () => {
  return (
    <div className='flex justify-center border-t-[1px]'>
      <div className="container mx-auto px-4 py-8 w-[80%]">
          <h1 className="text-4xl font-bold border-b-2 border-gray-300 pb-2 mb-8">Chính sách hoàn tiền và hủy đơn</h1>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">1. Giới thiệu</h2><p>Chính sách hoàn tiền và hủy đơn được xây dựng nhằm bảo đảm quyền lợi của khách hàng khi mua sắm trên website. Vui lòng đọc kỹ để hiểu rõ quyền và nghĩa vụ của bạn trước khi đặt hàng.</p></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">2. Hủy đơn hàng</h2><h3 className="text-xl font-semibold mb-1">Hủy đơn</h3><p>Bạn có thể hủy đơn trước khi đơn hàng được giao cho đơn vị vận chuyển. Để hủy đơn, vui lòng liên hệ bộ phận hỗ trợ qua <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a>. Nếu đơn đã được gửi đi, bạn cần thực hiện quy trình đổi trả để được xem xét hoàn tiền.</p><h3 className="text-xl font-semibold mb-1">Hủy gói dịch vụ</h3><p>Nếu bạn đăng ký một dịch vụ, bạn có thể hủy trong tài khoản hoặc liên hệ hỗ trợ. Phí đã thanh toán cho kỳ hiện tại thường không được hoàn lại và việc hủy sẽ có hiệu lực khi kết thúc chu kỳ hiện tại.</p></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">3. Hoàn tiền</h2><h3 className="text-xl font-semibold mb-1">Điều kiện hoàn tiền</h3><p>Sản phẩm cần còn nguyên tình trạng ban đầu, chưa qua sử dụng và còn bao bì. Một số sản phẩm như hàng đặt riêng, sản phẩm tải xuống hoặc sản phẩm đã qua sử dụng có thể không đủ điều kiện hoàn tiền.</p><h3 className="text-xl font-semibold mb-1">Quy trình hoàn tiền</h3><p>Để yêu cầu hoàn tiền, vui lòng gửi email tới <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a> kèm mã đơn hàng, bằng chứng mua hàng và lý do yêu cầu. Chúng tôi sẽ kiểm tra và thông báo kết quả xử lý.</p></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">4. Phí vận chuyển đổi trả</h2><p>Nếu yêu cầu hoàn tiền được chấp nhận, bạn có thể cần tự thanh toán phí gửi trả sản phẩm. Phí vận chuyển thường không được hoàn lại. Trong một số trường hợp, phí vận chuyển trả hàng sẽ được khấu trừ vào số tiền hoàn.</p></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">5. Sản phẩm không hoàn tiền</h2><p>Một số sản phẩm không được hoàn tiền, bao gồm:</p><ul className="list-disc list-inside ml-4"><li>Thẻ quà tặng</li><li>Sản phẩm phần mềm tải xuống</li><li>Một số sản phẩm chăm sóc cá nhân</li><li>Hàng thanh lý</li><li>Sản phẩm đặt riêng</li></ul></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">6. Đổi sản phẩm</h2><p>Chúng tôi chỉ hỗ trợ đổi sản phẩm nếu sản phẩm bị lỗi hoặc hư hỏng. Nếu cần đổi sang sản phẩm cùng loại, vui lòng gửi email tới <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a>.</p></section>
          <section className="mb-8"><h2 className="text-2xl font-semibold mb-2">7. Liên hệ</h2><p>Nếu bạn có câu hỏi về chính sách hoàn tiền và hủy đơn, vui lòng liên hệ với chúng tôi qua <a href="mailto:support@yourwebsite.com" className="text-blue-500">support@yourwebsite.com</a>.</p></section>
      </div>
    </div>
  )
}

export default RefundCancellation
