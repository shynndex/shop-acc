import mongoose from "mongoose";
import GameCategory from "../models/admin/GameCategory.model.js";
import CmsPage from "../models/admin/CmsPage.model.js";
import Banner from "../models/admin/Banner.model.js";
import Popup from "../models/admin/Popup.model.js";
import Account from "../models/Account.model.js";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_GAMES = [
  {
    gameSlug: "lien-quan",
    gameName: "LIÊN QUÂN MOBILE",
    gameIcon: "🎮",
    iconType: "emoji",
    sortOrder: 0,
    categories: [
      {
        id: "lq-trang",
        name: "Nick Thông Tin Đẹp",
        slug: "nick-thong-tin-dep",
        typeValue: "trang",
        image: "../../public/nakvt.gif",
        priceFrom: 100000,
        stock: 8,
      },
      {
        id: "lq-reg",
        name: "Nick Reg Trắng",
        slug: "nick-reg-trang",
        typeValue: "reg",
        image: "/img/lq-reg.jpg",
        priceFrom: 30000,
        stock: 110,
      },
      {
        id: "lq-rlp",
        name: "Nick RLP",
        slug: "nick-rlp",
        typeValue: "rlp",
        image: "/img/lq-rlp.jpg",
        priceFrom: 270000,
        stock: 6,
      },
    ],
  },
  {
    gameSlug: "valorant",
    gameName: "VALORANT",
    gameIcon: "🔫",
    iconType: "emoji",
    sortOrder: 1,
    categories: [
      {
        id: "val-rank",
        name: "Acc Rank Cứng",
        slug: "acc-rank-cung",
        typeValue: "rank",
        image: "/img/val-rank.jpg",
        priceFrom: 150000,
        stock: 15,
      },
      {
        id: "val-skin",
        name: "Acc Full Skin",
        slug: "acc-full-skin",
        typeValue: "skin",
        image: "/img/val-skin.jpg",
        priceFrom: 500000,
        stock: 4,
      },
    ],
  },
  {
    gameSlug: "free-fire",
    gameName: "FREE FIRE",
    gameIcon: "🔥",
    iconType: "emoji",
    sortOrder: 2,
    categories: [
      {
        id: "ff-vip",
        name: "Acc VIP Bundle",
        slug: "acc-vip-bundle",
        typeValue: "vip",
        image: "/img/ff-vip.jpg",
        priceFrom: 200000,
        stock: 22,
      },
    ],
  },
  {
    gameSlug: "lien-minh",
    gameName: "LMHT",
    gameIcon: "⚔️",
    iconType: "emoji",
    sortOrder: 3,
    categories: [
      {
        id: "lm-rank",
        name: "Acc Rank Cứng",
        slug: "lien-minh-acc-rank",
        typeValue: "rank",
        image: "/img/lm-rank.jpg",
        priceFrom: 100000,
        stock: 0,
      },
      {
        id: "lm-skin",
        name: "Acc Full Skin",
        slug: "lien-minh-acc-skin",
        typeValue: "skin",
        image: "/img/lm-skin.jpg",
        priceFrom: 300000,
        stock: 0,
      },
    ],
  },
  {
    gameSlug: "khac",
    gameName: "KHÁC",
    gameIcon: "🎲",
    iconType: "emoji",
    sortOrder: 4,
    categories: [
      {
        id: "khac-general",
        name: "Tài khoản khác",
        slug: "tai-khoan-khac",
        typeValue: "standard",
        image: "/img/other.jpg",
        priceFrom: 50000,
        stock: 0,
      },
    ],
  },
];

const DEFAULT_CMS_PAGES = [
  {
    slug: "gioi-thieu",
    title: "Giới thiệu",
    content: `<div>Chào mừng bạn đến với <strong>ShopSam</strong> - nền tảng giao dịch tài khoản game uy tín hàng đầu Việt Nam!</div>
<div> </div>
<div>Chúng tôi ra đời với sứ mệnh mang đến cho cộng đồng game thủ Việt Nam một kênh mua bán tài khoản game an toàn, nhanh chóng và minh bạch. Với hơn 5 năm kinh nghiệm trong lĩnh vực giao dịch tài khoản game, ShopSam tự hào là địa chỉ tin cậy của hàng ngàn game thủ trên khắp cả nước.</div>
<div> </div>
<h2>Tại sao chọn ShopSam?</h2>
<div> </div>
<ul><li><p><strong>Uy tín hàng đầu:</strong> Cam kết 100% tài khoản chính chủ, thông tin rõ ràng.</p></li><li><p><strong>Bảo mật tuyệt đối:</strong> Thông tin khách hàng được mã hóa và bảo vệ nghiêm ngặt.</p></li><li><p><strong>Giá tốt nhất:</strong> Niêm yết giá minh bạch, không phát sinh chi phí ẩn.</p></li><li><p><strong>Hỗ trợ 24/7:</strong> Đội ngũ nhân viên sẵn sàng hỗ trợ bạn mọi lúc mọi nơi.</p></li></ul>
<div> </div>
<h2>Phương châm hoạt động</h2>
<div>ShopSam luôn đặt lợi ích của khách hàng lên hàng đầu. Mỗi giao dịch thành công là một niềm vui và động lực để chúng tôi không ngừng cải thiện dịch vụ. Chúng tôi tin rằng, một thị trường game lành mạnh sẽ mang lại giá trị bền vững cho tất cả mọi người.</div>
<div> </div>
<div>Cảm ơn bạn đã tin tưởng và đồng hành cùng ShopSam!</div>`,
    metaTitle: "Giới thiệu về ShopSam - Nền tảng giao dịch acc game uy tín",
    metaDescription: "Tìm hiểu về ShopSam - nền tảng mua bán tài khoản game uy tín hàng đầu Việt Nam. Cam kết bảo mật, giá tốt, hỗ trợ 24/7.",
  },
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    content: `<div>ShopSam cam kết bảo vệ thông tin cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.</div>
<div> </div>
<h2>1. Thông tin chúng tôi thu thập</h2>
<div>Khi bạn đăng ký tài khoản hoặc thực hiện giao dịch trên ShopSam, chúng tôi có thể thu thập các thông tin sau:</div>
<ul><li><p>Họ tên, địa chỉ email, số điện thoại</p></li><li><p>Thông tin tài khoản game bạn mua/bán</p></li><li><p>Lịch sử giao dịch và thanh toán</p></li></ul>
<div> </div>
<h2>2. Mục đích sử dụng thông tin</h2>
<div>Chúng tôi sử dụng thông tin của bạn để:</div>
<ul><li><p>Xử lý và xác nhận giao dịch</p></li><li><p>Hỗ trợ khách hàng khi cần thiết</p></li><li><p>Cải thiện chất lượng dịch vụ</p></li><li><p>Gửi thông báo về các chương trình khuyến mãi (nếu bạn đồng ý)</p></li></ul>
<div> </div>
<h2>3. Cam kết bảo mật</h2>
<div>Chúng tôi cam kết:</div>
<ul><li><p>Không chia sẻ thông tin cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn</p></li><li><p>Áp dụng các biện pháp bảo mật tiên tiến để bảo vệ dữ liệu</p></li><li><p>Thường xuyên kiểm tra và nâng cấp hệ thống bảo mật</p></li></ul>
<div> </div>
<h2>4. Liên hệ</h2>
<div>Nếu có bất kỳ thắc mắc nào về chính sách bảo mật, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@shopacc.com"><strong>support@shopacc.com</strong></a>.</div>`,
    metaTitle: "Chính sách bảo mật - ShopSam",
    metaDescription: "Chính sách bảo mật thông tin khách hàng tại ShopSam. Cam kết bảo vệ thông tin cá nhân và an toàn dữ liệu.",
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    content: `<div>ShopSam cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng. Dưới đây là chính sách đổi trả và bảo hành tài khoản.</div>
<div> </div>
<h2>1. Điều kiện đổi trả</h2>
<div>Quý khách được yêu cầu đổi trả hoặc hoàn tiền trong các trường hợp sau:</div>
<ul><li><p><strong>Tài khoản không đúng mô tả:</strong> Thông tin tài khoản khác biệt so với mô tả trên website (rank, skin, số tướng...)</p></li><li><p><strong>Lỗi đăng nhập:</strong> Tài khoản không thể đăng nhập được do sai thông tin hoặc đã bị khóa</p></li><li><p><strong>Tài khoản đã qua sử dụng:</strong> Phát hiện tài khoản đã được đăng nhập trước đó (đối với acc reg trắng)</p></li></ul>
<div> </div>
<h2>2. Thời gian bảo hành</h2>
<div>Thời gian bảo hành tài khoản là <strong>7 ngày</strong> kể từ thời điểm giao dịch thành công. Sau thời gian này, ShopSam không chịu trách nhiệm về các vấn đề phát sinh từ phía người mua.</div>
<div> </div>
<h2>3. Quy trình đổi trả</h2>
<div>Bước 1: Liên hệ với bộ phận hỗ trợ qua email hoặc chat trực tuyến</div>
<div>Bước 2: Cung cấp mã giao dịch và mô tả vấn đề</div>
<div>Bước 3: ShopSam kiểm tra và xác nhận trong vòng 24 giờ làm việc</div>
<div>Bước 4: Tiến hành đổi tài khoản mới hoặc hoàn tiền</div>
<div> </div>
<h2>4. Trường hợp không áp dụng đổi trả</h2>
<ul><li><p>Khách hàng đã thay đổi thông tin tài khoản (đổi mật khẩu, email, số điện thoại)</p></li><li><p>Vi phạm điều khoản sử dụng của game</p></li><li><p>Yêu cầu đổi trả sau 7 ngày kể từ khi giao dịch</p></li></ul>`,
    metaTitle: "Chính sách đổi trả và bảo hành - ShopSam",
    metaDescription: "Chính sách đổi trả và bảo hành tài khoản game tại ShopSam. Bảo hành 7 ngày, hoàn tiền nếu tài khoản không đúng mô tả.",
  },
  {
    slug: "dieu-khoan-dich-vu",
    title: "Điều khoản dịch vụ",
    content: `<div>Vui lòng đọc kỹ các điều khoản dịch vụ trước khi sử dụng website ShopSam. Bằng việc truy cập và sử dụng dịch vụ, bạn đồng ý với các điều khoản dưới đây.</div>
<div> </div>
<h2>1. Chấp nhận điều khoản</h2>
<div>Khi đăng ký tài khoản hoặc thực hiện giao dịch trên ShopSam, bạn xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản dịch vụ.</div>
<div> </div>
<h2>2. Trách nhiệm của người dùng</h2>
<ul><li><p>Cung cấp thông tin chính xác khi đăng ký tài khoản</p></li><li><p>Không sử dụng dịch vụ cho mục đích gian lận hoặc bất hợp pháp</p></li><li><p>Bảo mật thông tin tài khoản của mình</p></li><li><p>Kiểm tra kỹ thông tin tài khoản game trước khi xác nhận mua</p></li></ul>
<div> </div>
<h2>3. Quyền của ShopSam</h2>
<ul><li><p>ShopSam có quyền từ chối giao dịch nếu phát hiện dấu hiệu gian lận</p></li><li><p>ShopSam có quyền tạm khóa tài khoản vi phạm điều khoản</p></li><li><p>ShopSam có quyền thay đổi điều khoản dịch vụ mà không cần thông báo trước</p></li></ul>
<div> </div>
<h2>4. Giải quyết tranh chấp</h2>
<div>Mọi tranh chấp phát sinh trong quá trình giao dịch sẽ được giải quyết dựa trên cơ sở thỏa thuận và lợi ích của cả hai bên. Trường hợp không thể thương lượng, vấn đề sẽ được đưa ra cơ quan pháp luật có thẩm quyền.</div>`,
    metaTitle: "Điều khoản dịch vụ - ShopSam",
    metaDescription: "Điều khoản sử dụng dịch vụ tại ShopSam. Cam kết minh bạch và bảo vệ quyền lợi người dùng.",
  },
  {
    slug: "huong-dan-mua-hang",
    title: "Hướng dẫn mua hàng",
    content: `<div>Hướng dẫn chi tiết các bước mua tài khoản game trên ShopSam. Chỉ với vài thao tác đơn giản, bạn đã có thể sở hữu tài khoản game ưng ý.</div>
<div> </div>
<h2>Bước 1: Đăng nhập / Đăng ký</h2>
<div>Truy cập website ShopSam và đăng nhập bằng tài khoản của bạn. Nếu chưa có tài khoản, bạn có thể đăng ký miễn phí tại trang <a href="/signup"><strong>Đăng ký</strong></a>.</div>
<div> </div>
<h2>Bước 2: Nạp tiền vào tài khoản</h2>
<div>Trước khi mua hàng, vui lòng nạp tiền vào tài khoản ShopSam. Bạn có thể nạp tiền qua:</div>
<ul><li><p><strong>Chuyển khoản ngân hàng:</strong> Hỗ trợ tất cả các ngân hàng nội địa</p></li><li><p><strong>Thẻ cào điện thoại:</strong> Viettel, Mobifone, Vinaphone, Vietnamobile</p></li></ul>
<div> </div>
<h2>Bước 3: Chọn tài khoản game</h2>
<div>Duyệt qua danh mục game hoặc sử dụng thanh tìm kiếm để tìm tài khoản phù hợp. Bạn có thể lọc theo game, loại tài khoản và khoảng giá.</div>
<div> </div>
<h2>Bước 4: Thanh toán và nhận tài khoản</h2>
<div>Sau khi chọn được tài khoản ưng ý, nhấn "Mua ngay" và xác nhận thanh toán. Thông tin tài khoản game sẽ được hiển thị ngay sau khi giao dịch thành công. Bạn cũng sẽ nhận được email xác nhận chi tiết.</div>
<div> </div>
<h2>Mẹo nhỏ</h2>
<ul><li><p>So sánh nhiều tài khoản trước khi quyết định mua</p></li><li><p>Đọc kỹ mô tả và thông số tài khoản</p></li><li><p>Liên hệ hỗ trợ nếu cần tư vấn thêm</p></li></ul>`,
    metaTitle: "Hướng dẫn mua hàng - ShopSam",
    metaDescription: "Hướng dẫn chi tiết các bước mua tài khoản game trên ShopSam. Từ đăng ký, nạp tiền đến thanh toán và nhận tài khoản.",
  },
  {
    slug: "huong-dan-nap-tien",
    title: "Hướng dẫn nạp tiền",
    content: `<div>ShopSam hỗ trợ nhiều phương thức nạp tiền tiện lợi và an toàn. Dưới đây là hướng dẫn chi tiết từng phương thức.</div>
<div> </div>
<h2>💳 Nạp tiền qua chuyển khoản ngân hàng</h2>
<div>Đây là phương thức nạp tiền được nhiều người dùng lựa chọn nhất. Số tiền sẽ được cập nhật tự động ngay sau khi bạn chuyển khoản thành công.</div>
<div> </div>
<h3>Các bước thực hiện:</h3>
<div>Bước 1: Đăng nhập và vào mục <strong>"Nạp tiền"</strong> trên website</div>
<div>Bước 2: Chọn phương thức <strong>"Chuyển khoản ngân hàng"</strong></div>
<div>Bước 3: Nhập số tiền muốn nạp và chọn ngân hàng</div>
<div>Bước 4: Hệ thống sẽ hiển thị thông tin tài khoản ngân hàng cần chuyển khoản</div>
<div>Bước 5: Thực hiện chuyển khoản và chờ xác nhận tự động (thường trong vòng 1-2 phút)</div>
<div> </div>
<h2>📱 Nạp tiền qua thẻ cào điện thoại</h2>
<h3>Các bước thực hiện:</h3>
<div>Bước 1: Đăng nhập và vào mục <strong>"Nạp tiền"</strong></div>
<div>Bước 2: Chọn phương thức <strong>"Thẻ cào"</strong></div>
<div>Bước 3: Nhập thông tin thẻ (mã thẻ, seri, mệnh giá)</div>
<div>Bước 4: Hệ thống xử lý và cộng tiền vào tài khoản (có thể mất vài phút)</div>
<div> </div>
<h2>Lưu ý quan trọng</h2>
<ul><li><p>Số tiền tối thiểu mỗi lần nạp: <strong>10.000đ</strong></p></li><li><p>Số tiền tối đa mỗi lần nạp: <strong>10.000.000đ</strong></p></li><li><p>Nếu sau 5 phút chưa nhận được tiền, vui lòng liên hệ bộ phận hỗ trợ</p></li></ul>`,
    metaTitle: "Hướng dẫn nạp tiền - ShopSam",
    metaDescription: "Hướng dẫn chi tiết cách nạp tiền vào tài khoản ShopSam qua chuyển khoản ngân hàng hoặc thẻ cào điện thoại.",
  },
  {
    slug: "faq",
    title: "Câu hỏi thường gặp",
    content: `<div>Những câu hỏi thường gặp khi mua bán tài khoản game trên ShopSam. Nếu bạn có thắc mắc khác, vui lòng liên hệ với chúng tôi.</div>
<div> </div>
<h2>❓ Tài khoản game mua về có an toàn không?</h2>
<div>Tất cả tài khoản trên ShopSam đều được kiểm tra kỹ lưỡng trước khi đăng bán. Chúng tôi cam kết tài khoản chính chủ, chưa qua sử dụng và đầy đủ thông tin như mô tả.</div>
<div> </div>
<h2>❓ Làm sao để đổi trả nếu tài khoản không đúng?</h2>
<div>Bạn có thể yêu cầu đổi trả trong vòng 7 ngày nếu tài khoản không đúng mô tả. Vui lòng xem chi tiết tại trang <a href="/pages/chinh-sach-doi-tra"><strong>Chính sách đổi trả</strong></a>.</div>
<div> </div>
<h2>❓ Tôi có thể mua nhiều tài khoản cùng lúc không?</h2>
<div>Có, bạn có thể thêm nhiều tài khoản vào giỏ hàng và thanh toán một lần. Tuy nhiên, mỗi tài khoản sẽ được xử lý riêng lẻ để đảm bảo tính chính xác.</div>
<div> </div>
<h2>❓ Tiền trong tài khoản có được hoàn lại không?</h2>
<div>Tiền trong tài khoản ShopSam có thể được sử dụng để mua bất kỳ tài khoản game nào trên website. Chúng tôi hiện không hỗ trợ hoàn tiền mặt, trừ các trường hợp đặc biệt theo chính sách đổi trả.</div>
<div> </div>
<h2>❓ Làm sao để liên hệ hỗ trợ?</h2>
<div>Bạn có thể liên hệ với chúng tôi qua:</div>
<ul><li><p><strong>Email:</strong> support@shopacc.com</p></li><li><p><strong>Chat trực tuyến:</strong> Tính năng chat trên website (hoạt động 24/7)</p></li><li><p><strong>Fanpage:</strong> facebook.com/shopacc</p></li></ul>
<div> </div>
<h2>❓ Mất bao lâu để nhận được tài khoản sau khi thanh toán?</h2>
<div>Thông thường, thông tin tài khoản sẽ được hiển thị ngay lập tức sau khi thanh toán thành công. Trong một số trường hợp hiếm hoi, có thể mất tới 5 phút để hệ thống xử lý.</div>`,
    metaTitle: "FAQ - Câu hỏi thường gặp - ShopSam",
    metaDescription: "Giải đáp các câu hỏi thường gặp về mua bán tài khoản game tại ShopSam. Bảo hành, đổi trả, nạp tiền và nhiều thông tin hữu ích.",
  },
  {
    slug: "lien-he",
    title: "Liên hệ",
    content: `<div>Chúng tôi luôn sẵn sàng hỗ trợ bạn! Hãy liên hệ với ShopSam qua một trong các kênh dưới đây.</div>
<div> </div>
<h2>📍 Địa chỉ</h2>
<div>Hà Nội, Việt Nam</div>
<div> </div>
<h2>📞 Hotline</h2>
<div><strong>1900 xxxx</strong> (Miễn phí - 24/7)</div>
<div> </div>
<h2>✉️ Email</h2>
<div><a href="mailto:support@shopacc.com">support@shopacc.com</a></div>
<div> </div>
<h2> Thời gian làm việc</h2>
<div>Hỗ trợ trực tuyến: <strong>24/7</strong> tất cả các ngày trong tuần, kể cả ngày lễ và Tết.</div>
<div> </div>
<h2>💬 Chat trực tuyến</h2>
<div>Bạn có thể sử dụng tính năng chat trực tuyến ở góc dưới bên phải màn hình để được hỗ trợ nhanh nhất.</div>`,
    metaTitle: "Liên hệ - ShopSam",
    metaDescription: "Thông tin liên hệ ShopSam. Email, hotline, địa chỉ và thời gian làm việc. Hỗ trợ 24/7.",
  },
  {
    slug: "footer",
    title: "Footer",
    content: `<div><strong>ShopSam</strong> - Nền tảng giao dịch tài khoản game uy tín hàng đầu Việt Nam.</div>
<div>© 2024 ShopSam. All rights reserved.</div>`,
    metaTitle: "",
    metaDescription: "",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // ─── Seed Game Categories ────────────────────────────────────────────
    console.log("\n--- Seeding Game Categories ---");
    for (const gameData of DEFAULT_GAMES) {
      const exists = await GameCategory.findOne({ gameSlug: gameData.gameSlug });
      if (exists) {
        console.log(`  ⏭️  "${gameData.gameName}" already exists, skipping`);
      } else {
        await GameCategory.create(gameData);
        console.log(`  ✅ Created "${gameData.gameName}"`);
      }
    }

    // ─── Seed CMS Pages ───────────────────────────────────────────────────
    console.log("\n--- Seeding CMS Pages ---");
    for (const pageData of DEFAULT_CMS_PAGES) {
      const exists = await CmsPage.findOne({ slug: pageData.slug });
      if (exists) {
        await CmsPage.updateOne({ slug: pageData.slug }, pageData);
        console.log(`  ✅ Updated "/${pageData.slug}" — ${pageData.title}`);
      } else {
        await CmsPage.create(pageData);
        console.log(`  ✅ Created "/${pageData.slug}" — ${pageData.title}`);
      }
    }

    // ─── Seed Default Banners ─────────────────────────────────────────────
    console.log("\n--- Seeding Default Banners ---");
    const DEFAULT_BANNERS = [
      {
        title: "🎮 Kho tài khoản game chất lượng",
        imageDesktopUrl: "https://placehold.co/1200x400/6366f1/ffffff?text=Kho+Acc+Game+Chat+Luong",
        imageMobileUrl: "https://placehold.co/600x400/6366f1/ffffff?text=Acc+Game",
        headline: "Tài khoản game chính chủ - Giá tốt nhất thị trường",
        description: "Liên Quân, VALORANT, Free Fire, LMHT và nhiều tựa game hot khác. Bảo hành uy tín, hỗ trợ 24/7.",
        ctaText: "Khám phá ngay",
        ctaLink: "/tai-khoan",
        isActive: true,
        sortOrder: 0,
      },
      {
        title: "🔥 Sale tuần mới - Giảm đến 15%",
        imageDesktopUrl: "https://placehold.co/1200x400/ef4444/ffffff?text=Sale+15%25+All+Acc",
        imageMobileUrl: "https://placehold.co/600x400/ef4444/ffffff?text=Sale+15%25",
        headline: "Ưu đãi đặc biệt dành cho bạn",
        description: "Giảm thêm 10% cho đơn hàng đầu tiên. Sử dụng mã WELCOME10 khi thanh toán.",
        ctaText: "Nhận ưu đãi",
        ctaLink: "/tai-khoan?promo=welcome",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "🎯 Tài khoản Rank Cao - Giá Sốc",
        imageDesktopUrl: "https://placehold.co/1200x400/10b981/ffffff?text=Acc+Rank+Cao+Gia+Shock",
        imageMobileUrl: "https://placehold.co/600x400/10b981/ffffff?text=Rank+Cao",
        headline: "Acc rank cao, full skin - Giá chỉ từ 30.000đ",
        description: "Sở hữu ngay tài khoản rank cao, full tướng, full skin với giá ưu đãi nhất. Số lượng có hạn!",
        ctaText: "Xem ngay",
        ctaLink: "/tai-khoan?sort=rank",
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "💎 Gói VIP - Ưu đãi độc quyền",
        imageDesktopUrl: "https://placehold.co/1200x400/f59e0b/ffffff?text=VIP+Exclusive+Deal",
        imageMobileUrl: "https://placehold.co/600x400/f59e0b/ffffff?text=VIP",
        headline: "Nâng cấp VIP để nhận ưu đãi đặc biệt",
        description: "Giảm 5% mọi đơn hàng, ưu tiên hỗ trợ, quà tặng sinh nhật và nhiều đặc quyền khác.",
        ctaText: "Tìm hiểu thêm",
        ctaLink: "/vip",
        isActive: true,
        sortOrder: 3,
      },
    ];
    for (let i = 0; i < DEFAULT_BANNERS.length; i++) {
      const data = DEFAULT_BANNERS[i];
      const existing = await Banner.findOne({ sortOrder: i });
      if (existing) {
        await Banner.updateOne({ _id: existing._id }, data);
        console.log(`  ✅ Updated banner #${i} — "${data.title}"`);
      } else {
        await Banner.create(data);
        console.log(`  ✅ Created banner #${i} — "${data.title}"`);
      }
    }

    // ─── Seed Popups ───────────────────────────────────────────────────────
    console.log("\n--- Seeding Popups ---");
    const DEFAULT_POPUPS = [
      {
        title: "Chào mừng đến với ShopSam!",
        type: "notification",
        content: "<div>Cảm ơn bạn đã ghé thăm ShopSam! 🎉</div><div> </div><div>Chúng tôi chuyên cung cấp tài khoản game uy tín với giá tốt nhất thị trường. Sử dụng mã <strong>WELCOME10</strong> để được giảm 10% cho đơn hàng đầu tiên!</div>",
        imageUrl: "https://placehold.co/600x300/6366f1/ffffff?text=Chao+Mung",
        ctaText: "Khám phá ngay",
        ctaLink: "/tai-khoan",
        displayPages: ["home", "shop", "all"],
        triggerType: "timeout",
        triggerDelay: 3,
        isActive: true,
        sortOrder: 0,
      },
      {
        title: "🎁 Siêu khuyến mãi cuối tuần",
        type: "promotion",
        content: "<div><strong>🔥 Sale cuối tuần - Giảm đến 15%</strong></div><div> </div><div>Chương trình khuyến mãi đặc biệt cuối tuần này:</div><ul><li><p>Giảm 15% cho acc rank Cao</p></li><li><p>Giảm 10% cho acc full skin</p></li><li><p>Miễn phí bảo hành 14 ngày</p></li></ul><div> </div><div>Nhanh tay kẻo lỡ! ⏰</div>",
        imageUrl: "https://placehold.co/600x300/ef4444/ffffff?text=Sale+Cuoi+Tuan",
        ctaText: "Mua ngay",
        ctaLink: "/tai-khoan",
        displayPages: ["home", "shop", "account-detail"],
        triggerType: "timeout",
        triggerDelay: 10,
        isActive: true,
        sortOrder: 1,
      },
    ];
    for (let i = 0; i < DEFAULT_POPUPS.length; i++) {
      const data = DEFAULT_POPUPS[i];
      const existing = await Popup.findOne({ sortOrder: i });
      if (existing) {
        await Popup.updateOne({ _id: existing._id }, data);
        console.log(`  ✅ Updated popup #${i} — "${data.title}"`);
      } else {
        await Popup.create(data);
        console.log(`  ✅ Created popup #${i} — "${data.title}"`);
      }
    }

    // ─── Seed Sample Accounts ─────────────────────────────────────────────
    console.log("\n--- Seeding Sample Accounts ---");
    const DEFAULT_ACCOUNTS = [
      // ── Liên Quân Mobile ──
      {
        title: "Acc Liên Quân - Thông tin đẹp - 100 tướng",
        game: "lien-quan",
        price: 350000,
        description: "Acc đẹp, full tướng thông dụng, nhiều trang phục giới hạn. Rank Cao Thủ, đã liên kết Garena.",
        attributes: { rank: "Cao Thủ", tier: "3 sao", heroes: 100, skins: 45, skinHighlight: "Lữ Bố Hắc Ám, Nakroth VIP" },
        type: "trang",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+1"],
        status: "available",
        loginInfo: { username: "lienquan_acc1", password: "ShopSam@2024" },
      },
      {
        title: "Acc Liên Quân Reg Trắng - 50 tướng",
        game: "lien-quan",
        price: 80000,
        description: "Acc reg trắng, chưa qua sử dụng. Có sẵn 50 tướng + 10 trang phục. Thích hợp leo rank từ đầu.",
        attributes: { rank: "Vô Cực", heroes: 50, skins: 10, newAccount: true },
        type: "reg",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+Reg"],
        status: "available",
        loginInfo: { username: "lienquan_reg1", password: "ShopSam@2024" },
      },
      {
        title: "Acc Liên Quân RLP - Nhiều skin",
        game: "lien-quan",
        price: 450000,
        description: "Acc RLP hệ đẹp, nhiều skin giới hạn. Rank Tinh Anh. Thông tin đầy đủ.",
        attributes: { rank: "Tinh Anh", heroes: 80, skins: 65, skinHighlight: "Tel'annas Mùa Hè, Violet Thợ Săn" },
        type: "rlp",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+RLP"],
        status: "available",
        loginInfo: { username: "lienquan_rlp1", password: "ShopSam@2024" },
      },
      // ── VALORANT ──
      {
        title: "Acc VALORANT - Rank Vàng 3 - Nhiều skin",
        game: "valorant",
        price: 250000,
        description: "Acc VALORANT rank Vàng 3. Có sẵn 8 skin súng cao cấp (Reaver, Prime, Oni...). Liên kết Riot.",
        attributes: { rank: "Vàng 3", peakRank: "Bạch Kim 1", skins: 8, skinHighlight: "Reaver Vandal, Prime Phantom", vp: 450 },
        type: "rank",
        images: ["https://placehold.co/400x300/ef4444/ffffff?text=VALORANT+1"],
        status: "available",
        loginInfo: { username: "val_acc1", password: "ShopSam@2024" },
      },
      {
        title: "Acc VALORANT - Full Skin Bundle",
        game: "valorant",
        price: 800000,
        description: "Acc full skin cao cấp. Sở hữu bộ sưu tập skin đồ sộ: RGX, Prelude to Chaos, Ion, Glitchpop... Đẳng cấp!",
        attributes: { rank: "Bạc 2", skins: 35, skinHighlight: "RGX 11z Pro Set, Prelude to Chaos Set", vp: 1200, radianite: 800 },
        type: "skin",
        images: ["https://placehold.co/400x300/ef4444/ffffff?text=VALORANT+Full+Skin"],
        status: "available",
        loginInfo: { username: "val_full1", password: "ShopSam@2024" },
      },
      // ── Free Fire ──
      {
        title: "Acc Free Fire VIP - Nhiều nhân vật",
        game: "free-fire",
        price: 200000,
        description: "Acc VIP sở hữu nhiều nhân vật đặc biệt + skin vũ khí. Rank Huyền Thoại. Đã liên kết Garena.",
        attributes: { rank: "Huyền Thoại", characters: 25, skins: 30, diamonds: 500, level: 75 },
        type: "vip",
        images: ["https://placehold.co/400x300/f59e0b/ffffff?text=Free+Fire+VIP"],
        status: "available",
        loginInfo: { username: "freefire_vip1", password: "ShopSam@2024" },
      },
      // ── LMHT ──
      {
        title: "Acc LMHT - Rank Kim Cương - Nhiều tướng",
        game: "lien-minh",
        price: 500000,
        description: "Acc LMHT rank Kim Cương 4. Full tướng, nhiều trang phục giới hạn (Dark Star, PROJECT, Pulsefire...).",
        attributes: { rank: "Kim Cương 4", peakRank: "Cao Thần", champions: 155, skins: 120, skinHighlight: "Pulsefire Ezreal, Dark Star Thresh" },
        type: "rank",
        images: ["https://placehold.co/400x300/10b981/ffffff?text=LMHT+Rank"],
        status: "available",
        loginInfo: { username: "lienminh_acc1", password: "ShopSam@2024" },
      },
      {
        title: "Acc LMHT - Full Skin Siêu Phẩm",
        game: "lien-minh",
        price: 1200000,
        description: "Bộ sưu tập skin đồ sộ. Ultimate skins (Elementalist Lux, Spirit Guard Udyr...). Đẳng cấp collector!",
        attributes: { rank: "Bạch Kim 2", champions: 150, skins: 280, skinHighlight: "Elementalist Lux, Spirit Guard Udyr, DJ Sona", rare: true },
        type: "skin",
        images: ["https://placehold.co/400x300/10b981/ffffff?text=LMHT+Full+Skin"],
        status: "available",
        loginInfo: { username: "lienminh_skin1", password: "ShopSam@2024" },
      },
      // ── Tài khoản khác ──
      {
        title: "Acc Steam - 20 game + Counter Strike 2",
        game: "khac",
        price: 120000,
        description: "Acc Steam có sẵn CS2, Dota 2, và nhiều game free khác. Đã xác thực số điện thoại.",
        attributes: { platform: "Steam", games: 20, highlightedGame: "Counter Strike 2", verifiedEmail: true, level: 5 },
        type: "standard",
        images: ["https://placehold.co/400x300/6b7280/ffffff?text=Steam+Acc"],
        status: "available",
        loginInfo: { username: "steam_acc1", password: "ShopSam@2024" },
      },
      {
        title: "Acc Tốc Chiến - Rank Cao",
        game: "khac",
        price: 180000,
        description: "Acc Tốc Chiến rank Cao Thủ. Nhiều tướng + skin. Chơi ngay trên mobile.",
        attributes: { game: "Tốc Chiến", rank: "Cao Thủ", champions: 60, skins: 25 },
        type: "standard",
        images: ["https://placehold.co/400x300/6b7280/ffffff?text=Toc+Chien"],
        status: "available",
        loginInfo: { username: "tochien_acc1", password: "ShopSam@2024" },
      },
      // ── Thêm available ──
      {
        title: "Acc Liên Quân - Thông tin đẹp - Siêu phẩm",
        game: "lien-quan",
        price: 650000,
        description: "Acc siêu phẩm: 120 tướng, 80 skin, rank Tinh Anh 1 sao. Có nhiều skin giới hạn sự kiện mùa hè.",
        attributes: { rank: "Tinh Anh 1", heroes: 120, skins: 80, skinHighlight: "Nakroth Vô Cực, Tel'annas Ánh Trăng", vouchers: 1500 },
        type: "trang",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+Super"],
        status: "available",
        loginInfo: { username: "lienquan_super1", password: "ShopSam@2024" },
      },
      {
        title: "Acc VALORANT - Bạch Kim 2 - Súng đẹp",
        game: "valorant",
        price: 380000,
        description: "Acc rank Bạch Kim 2, bộ sưu tập súng đẹp: Recon, Gaia's Vengeance, Origin. Nhiều Battle Pass hoàn thành.",
        attributes: { rank: "Bạch Kim 2", peakRank: "Kim Cương 1", skins: 14, skinHighlight: "Recon Phantom, Gaia Vandal, Origin Sheriff", bpLevel: 45 },
        type: "rank",
        images: ["https://placehold.co/400x300/ef4444/ffffff?text=VALORANT+Plat"],
        status: "available",
        loginInfo: { username: "val_plat1", password: "ShopSam@2024" },
      },
      {
        title: "Acc Free Fire - Bundle Sự Kiện - Nhiều skin",
        game: "free-fire",
        price: 320000,
        description: "Acc Free Fire sở hữu nhiều skin sự kiện đặc biệt, nhân vật mới nhất. Rank Anh Hùng, đã mở full kỹ năng.",
        attributes: { rank: "Anh Hùng", characters: 35, skins: 55, diamonds: 1200, level: 80, petSkins: 8 },
        type: "vip",
        images: ["https://placehold.co/400x300/f59e0b/ffffff?text=Free+Fire+Event"],
        status: "available",
        loginInfo: { username: "freefire_event1", password: "ShopSam@2024" },
      },
      // ── Trạng thái reserved ──
      {
        title: "Acc Free Fire VIP - Bundle Kim Cương",
        game: "free-fire",
        price: 400000,
        description: "Acc VIP cao cấp với nhiều skin Kim Cương, nhân vật full bộ. Rank Huyền Thoại, đang được giữ chỗ.",
        attributes: { rank: "Huyền Thoại", characters: 40, skins: 70, diamonds: 2500, level: 85 },
        type: "vip",
        images: ["https://placehold.co/400x300/f59e0b/ffffff?text=Free+Fire+Reserved"],
        status: "reserved",
        reservedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Reserved 2 giờ trước
        loginInfo: { username: "freefire_res1", password: "ShopSam@2024" },
      },
      {
        title: "Acc LMHT - Rank Bạch Kim - Nhiều tướng",
        game: "lien-minh",
        price: 280000,
        description: "Acc LMHT rank Bạch Kim 1. Full tướng đường chính, nhiều trang phục khủng. Đang giữ chỗ cho khách.",
        attributes: { rank: "Bạch Kim 1", champions: 120, skins: 65, skinHighlight: "PROJECT: Vayne, High Noon Lucian" },
        type: "rank",
        images: ["https://placehold.co/400x300/10b981/ffffff?text=LMHT+Reserved"],
        status: "reserved",
        reservedAt: new Date(Date.now() - 30 * 60 * 1000), // Reserved 30 phút trước
        loginInfo: { username: "lienminh_res1", password: "ShopSam@2024" },
      },
      // ── Trạng thái sold ──
      {
        title: "Acc Liên Quân - Thông tin đẹp - 80 tướng",
        game: "lien-quan",
        price: 250000,
        description: "Acc Liên Quân chất lượng, 80 tướng, 40 skin. Rank Tinh Anh. Đã bán thành công.",
        attributes: { rank: "Tinh Anh", heroes: 80, skins: 40, skinHighlight: "Butterfly Sữa Tắm" },
        type: "trang",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+Sold"],
        status: "sold",
        soldAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Sold 7 ngày trước
        loginInfo: { username: "lienquan_sold1", password: "ShopSam@2024" },
      },
      {
        title: "Acc VALORANT - Rank Đồng - Giá rẻ",
        game: "valorant",
        price: 50000,
        description: "Acc VALORANT giá rẻ, rank Đồng 2, có skin cơ bản. Phù hợp người mới bắt đầu. Đã bán.",
        attributes: { rank: "Đồng 2", skins: 3, vp: 100 },
        type: "standard",
        images: ["https://placehold.co/400x300/ef4444/ffffff?text=VALORANT+Sold"],
        status: "sold",
        soldAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Sold 3 ngày trước
        loginInfo: { username: "val_sold1", password: "ShopSam@2024" },
      },
      // ── Trạng thái inactive ──
      {
        title: "Acc Liên Quân - Reg Trắng - Cơ bản",
        game: "lien-quan",
        price: 30000,
        description: "Acc reg trắng cơ bản. Tài khoản đã bị vô hiệu hóa do không đạt yêu cầu kiểm định.",
        attributes: { heroes: 15, skins: 2, newAccount: true },
        type: "reg",
        images: ["https://placehold.co/400x300/6366f1/ffffff?text=Lien+Quan+Inactive"],
        status: "inactive",
        loginInfo: { username: "lienquan_inactive1", password: "ShopSam@2024" },
      },
    ];
    let accountNewCount = 0;
    let accountUpdateCount = 0;
    for (const accData of DEFAULT_ACCOUNTS) {
      const { title, game } = accData;
      const existing = await Account.findOne({ title, game });
      if (existing) {
        await Account.updateOne({ _id: existing._id }, accData);
        accountUpdateCount++;
      } else {
        await Account.create(accData);
        accountNewCount++;
      }
    }
    console.log(`  ✅ Created ${accountNewCount} account(s), updated ${accountUpdateCount} account(s)`);

    console.log("\n🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
