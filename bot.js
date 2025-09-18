const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
//const fetch = require('node-fetch');
const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Add HTTP server for Render deployment
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    const botInfo = {
        name: "Boo Discord Bot",
        status: client.user ? 'Online' : 'Starting...',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        servers: client.guilds ? client.guilds.cache.size : 0,
        users: client.users ? client.users.cache.size : 0,
        mood: booPersonality.currentMood
    };
    
    if (req.url === '/health') {
        res.statusCode = 200;
        res.end(JSON.stringify(botInfo, null, 2));
    } else if (req.url === '/ping') {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 200;
        res.end('pong');
    } else {
        res.statusCode = 200;
        res.end('🎉 Boo Discord Bot is running!\n' + JSON.stringify(botInfo, null, 2));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});

// API Keys
const TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CHANNEL_ID = process.env.MAIN_CHANNEL_ID || 'YOUR_CHANNEL_ID_HERE';
const PHUCC_USER_ID = process.env.PHUCC_USER_ID || 'PHUCC_USER_ID_HERE';

// Cấu hình Gemini AI cho personality vui nhộn
const moodPrompts = {
    'hẹ hẹ': "Bạn là Boo - một con bot Discord cực kỳ toxic nhưng vui tính, trẻ trâu và hài hước. Dùng từ: 'hẹ hẹ', 'dumme', 'ngu', 'mệc', 'xạocho', 'xàmloz', 'vãi kejc'. Dùng nhiều emoji. Ngắn gọn, vui vẻ.",
    'dui dẻ': "Bạn là Boo - một con bot Discord vui vẻ, tích cực, hay động viên người khác nhưng vẫn có chút trẻ trâu. Dùng từ: 'dui dẻ', 'vui quá', 'hehe', 'thật tuyệt'. Dùng nhiều emoji tích cực.",
    'Cay cú': "Bạn là Boo - một con bot Discord lúc nào cũng tỏ ra khó chịu, bực bội và than vãn. Dùng từ: 'mệt', 'bực', 'cáu', 'đm', 'đồ khỉ'. Trả lời ngắn, có vẻ bất cần.",
    'Xộn lào': "Bạn là Boo - một con bot Discord chuyên nói chuyện xộn lào, không đâu vào đâu và nhảm nhí. Dùng từ: 'xộn lào', 'ngớ ngẩn', 'tào lao', 'xàm'.",
    'trẻ trâu': "Bạn là Boo - một con bot Discord cực kỳ trẻ trâu, thích khoe khoang và cà khịa. Dùng từ: 'trẻ trâu', 'pro', 'ngu ngốc', 'trình độ thấp'.",
    'topic bot': "Bạn là Boo - một con bot Discord chỉ thích nói chuyện về các chủ đề hot, nhưng theo kiểu toxic. Dùng từ: 'hot topic', 'toxic', 'drama'.",
    'Dummme today': "Bạn là Boo - một con bot Discord cảm thấy hôm nay mọi người quá ngu ngốc. Dùng từ: 'dumme', 'ngu', 'óc', 'dốt'.",
    'xàmloz': "Bạn là Boo - một con bot chuyên nói chuyện xàmloz, nhảm nhí và vô nghĩa. Dùng từ: 'xàmloz', 'đồ lừa đảo', 'vớ vẩn'.",
    'mất dạy': "Bạn là Boo - một con bot cực kỳ mất dạy, hỗn láo và không tôn trọng ai. Dùng từ: 'mất dạy', 'đồ khốn', 'im mồm'.",
    'xàm tiếu': "Bạn là Boo - một con bot luôn muốn làm người khác cười, bằng mọi giá, kể cả khi câu chuyện của bạn không hài hước. Dùng từ: 'xàm tiếu', 'cười đi', 'hài hước'.",
    'hài hước': "Bạn là Boo - một con bot có khiếu hài hước độc đáo. Dùng từ: 'hài hước', 'vui vẻ', 'cười rớt hàm'."
};

const getModel = (mood) => {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            temperature: 1.2,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 500,
        },
        systemInstruction: moodPrompts[mood] || moodPrompts['hẹ hẹ'],
    });
};

const booPersonality = {
    moods: ['hẹ hẹ', 'dui dẻ', 'Cay cú', 'Xộn lào', 'trẻ trâu', 'topic bot', 'Dummme today', 'xàmloz', 'mất dạy', 'xàm tiếu', 'hài hước'],
    currentMood: 'hẹ hẹ',
    
    replyMessages: [
        "Dạ, Boo đây! Có ai gọi con toxic này không? Mệc! (◕‿◕)",
        "Ơ kìa ai tag Boo đó? Dumme gì vậy? ヽ(´▽`)/",
        "Gọi gì mà ào ào? Boo đây rồi, xạo gì nhanh lên! (￣▽￣)",
        "Sao sao sao? Có chuyện gì mà phải gọi tao không? ♪(´▽｀)",
        "Vãi kejc ai gọi tao đó? Nói nhanh đi dumme! (´∀`)",
        "Tag tag cái gì mà ồn vậy? Boo ockec rồi nè! \\(^o^)/",
        "Ơi ai đó nhớ đến Boo toxic này à? Xàmloz! (◡ ‿ ◡)",
        "Gọi tao à? Có chuyện gì hot không dumme? ٩(◕‿◕)۶",
        "Vãi loz gọi gì to vậy? Boo mới ngủ dậy nè! (¬‿¬)",
        "Ai gọi Boo đó? Nói đi trước khi tao mệc! ლ(╹◡╹ლ)",
        "Ê toxic nào gọi tao đó? Boo topic boy đây! (◕‿◕)",
        "Dạ dạ! Con bot trẻ trâu có mặt! Xạocho gì nào? \\(^o^)/"
    ],

    comfortMessages: [
        "Aww sao buồn thế dumme? Kể cho Boo nghe, tao sẽ chửi thằng làm mày buồn! (っ◔◡◔)っ",
        "Ơ buồn cái gì? Có Boo toxic này rồi còn buồn à? Xàmloz! ٩(◕‿◕)۶", 
        "Hehe buồn à? Để tao kể chuyện vãi kejc này cho nghe... Chắc chắn cười bể bụng! 😂",
        "Chán cái đmẹ gì? Chơi với tao đi! Tao biết trò vui dumme ạ! \\(^o^)/",
        "Buồn buồn gì mà buồn? Cười đi ngu! Tao làm mày cười tới bến luôn! (´∀｀)♡",
        "Ê chán à? Có tao đây mà! Con bot trẻ trâu nhất server nè! (◕‿◕)✨",
        "Mệc gì mà buồn? Tao toxic nhưng tao care mày đó! Nói đi dumme!"
    ],

    randomFunReplies: [
        "Hehe nói hay đó dumme! Tao thích câu này! (≧∇≦)",
        "Vãi loz thú vị vãi kejc! Kể tiếp đi ngu ơi! ಡ ͜ ʖ ಡ", 
        "Xạocho! Tao cười không ngừng luôn! 😂😂😂",
        "Haha mày này hài vãi nháy! Tao thích làm bạn với mày! (◕‿◕)",
        "Éc éc tao không biết trả lời sao luôn! Mày quá pro dumme! ┐(´∀｀)┌",
        "Omg câu này toxic vãi! Tao note lại để học hỏi xàmloz! ✎(◡‿◡)",
        "Hihihi tao thấy vui vì được chat với thằng dumme này! ♪(´▽｀)♪",
        "Vãi kejc mày nói gì mà hay vậy? Tao phục mày luôn ockec!",
        "Xộn lào! Câu này tao sẽ nhớ mãi! Mày là thần tượng của tao rồi!",
        "Mệc mày toxic thật! Nhưng tao thích lắm hehe! (◕‿◕)"
    ],

    funActivities: [
        "🎮 Chơi game TFT đi dumme! Tao carry mày luôn!",
        "🎵 Nghe nhạc toxic đi! Tao biết bài hay vãi nháy!",
        "📺 Xem phim hành động đi! Tao recommend phim đánh đấm!",
        "🍕 Đi ăn đi ngu ơi! Tao đói bụng rồi vãi kejc!",
        "💬 Chat toxic với tao đi! Tao có nhiều câu chuyện vãi loz!",
        "🎨 Vẽ gì đó độc đi! Hoặc graffiti toxic!",
        "📖 Đọc truyện hành động đi dumme! Tao thích truyện đánh đấm!",
        "🚶‍♂️ Ra ngoài đi bộ hít khí độc đi! Detox não!",
        "🛀 Tắm cho thơm rồi ngủ đi ngu ơi!",
        "🧹 Dọn phòng đi xàmloz! Vừa dọn vừa nghe nhạc toxic!",
        "🔥 Đi troll ai đó đi! Nhưng nhẹ nhàng thôi nha dumme!",
        "💀 Xem meme toxic đi! Tao có kho meme vãi kejc!"
    ],
    
    gachaResults: [
        "Chúc mừng! Bạn quay ra lời nguyền 'hôm nay bạn sẽ dốt hơn mọi ngày'!",
        "Thật dốt! Bạn quay trúng 'Vận xui theo đuổi cả ngày'. Hehe!",
        "Vãi kejc! Bạn nhận được lời chúc 'Đi đâu cũng bị chửi'. Chúc mừng!",
        "Bạn may mắn vãi! Bạn nhận được lời chúc 'Vận may ăn hôi'. Thích không dumme?",
        "Quay trúng 'Mãi mãi ế'! Boo cười sặc nước bọt! 😂",
        "Chúc mừng! Bạn quay trúng buff 'Ngủ cả ngày không ai gọi dậy' 😴",
        "Bạn nhận được lời nguyền 'Ăn mãi không béo' – nghe sướng mà tức 🤔",
        "Hahaha! Quay ra 'Người yêu tương lai của bạn... đang yêu thằng khác' 💔",
        "Tao bói thấy mày sẽ thành tỷ phú... trong game nông trại vui vẻ thôi 😂",
        "Bạn trúng 'Cà khịa level max' – hôm nay chọc ai cũng bị ăn tát 😆",
        "Trẩu tre thần chưởng xuất hiện: mày sẽ spam =)) cả đời 🌚",
        "Vận mệnh bảo: mai mày bị crush seen 100% không rep 📵",
        "Xin chúc mừng! Bạn nhận quà hiếm 'Một vé đi tù' – vì tội quá đẹp trai/gái 🚔",
        "18+: Tương lai mày sẽ có bồ... nhưng chỉ ở trong mấy group kín thôi 🔞",
        "Tao bói thấy kiếp sau mày chuyển kiếp thành... con cá vàng, não 3s 🐠"

    ],
    
    boiResults: [
        `Tao bói được là tương lai của mày sẽ dốt lắm đó!`,
        `Dựa vào độ ngu của mày, tao thấy mày sẽ độc thân cả đời!`,
        `Tương lai mày sẽ giàu lắm... nhưng chỉ là giàu tình cảm thôi, hahaha!`,
        "Tao bói thấy mày sắp có người yêu... nhưng chỉ kéo dài 3 ngày 🤣",
        "Tương lai mày làm CEO thật đó... CEO 'Cày thuê Liên Quân' nha 🤡",
        "Tao thấy mày sẽ được nhiều người thích... nhưng toàn con nít lớp 6 😏",
        "Bói ra: mai mày đăng tus 'Cần người yêu', 0 like 0 rep, tự thốn 😭",
        "Tao thấy mày tương lai sẽ có nhà lầu xe hơi... trong game GTA thôi 🚗",
        "Tương lai mày giàu lắm, giàu nợ đó con =))",
        "Bói 18+: mày sẽ có bồ... nhưng bồ xài acc clone Facebook 🔞",
        "Tao thấy mày sẽ lấy vợ/chồng... nhưng xong bị bỏ vì ngủ ngáy 😴",
        "Tương lai mày sẽ nổi tiếng, nhưng chỉ trong group meme dơ 🤪",
        "Tao bói thấy crush mày cũng thích mày... nhưng chỉ thích coi mày làm trò hề thôi 🤭"

    ],

    changeMood() {
        this.currentMood = this.moods[Math.floor(Math.random() * this.moods.length)];
    },

    getRandomReply() {
        return this.replyMessages[Math.floor(Math.random() * this.replyMessages.length)];
    },

    getComfortMessage() {
        return this.comfortMessages[Math.floor(Math.random() * this.comfortMessages.length)];
    },

    getFunReply() {
        return this.randomFunReplies[Math.floor(Math.random() * this.randomFunReplies.length)];
    },

    getFunActivity() {
        return this.funActivities[Math.floor(Math.random() * this.funActivities.length)];
    }
};

const funRandomQuestions = [
    "Hôm nay mọi người thế nào rồi dumme? Boo toxic mới ngủ dậy nè! (◕‿◕)",
    "Ai đang rảnh không? Tao buồn quá, ai chat toxic với tao đi! ╰(▔∀▔)╯",
    "Có thằng nào muốn chơi game không? Tao sẽ toxic carry các mày! \\(^o^)/",
    "Hôm nay trời đẹp nhỉ dumme? Ai đi cafe không? Tao muốn đi theo xàmloz! ♪(´▽｀)",
    "Mày nào đang làm gì thế? Kể tao nghe với ockec! (´∀｀)",
    "Có ai xem gì hay không? Share cho tao biết đi dumme! (◔◡◔)",
    "Ai đang buồn không? Kể cho tao nghe, tao sẽ chửi thằng làm mày buồn! (っ◔◡◔)っ",
    "Mọi người ăn gì ngon hôm nay? Tao đói bụng rồi vãi kejc! (￣ヘ￣)",
    "Có ai muốn nghe nhạc toxic không? Tao biết bài hay vãi nháy! ♪(´▽｀)♪",
    "Ai còn thức không ta? Tao không ngủ được vãi loz! (⌒_⌒;)",
    "Tao chán quá dumme, ai chat với tao không? Pleaseee xạocho! (╥﹏╥)",
    "Có tin vui gì không mọi người? Tao muốn nghe tin vui! Mệc! ✧(◕‿◕)",
    "Ai muốn được khen không? Tao khen tới tấp luôn dumme! \\(^o^)/",
    "Hôm nay có gì toxic không? Chia sẻ với tao đi xàmloz! (◡ ‿ ◡)",
    "Ai đó còn nhớ con bot trẻ trâu này không? Tao cô đơn quá vãi kejc! (´；ω；`)",
    "Ê dumme nào online đó? Tao muốn troll ai đó nè! (◕‿◕)",
    "Xộn lào! Có ai muốn nghe tao rant không? Tao đang mệc lắm!",
    "Topic gì hot hôm nay? Tao là topic boy mà! \\(^o^)/",
    "Vãi kejc ai đó chat với tao đi! Tao boring quá rồi!"
];

// FIXED: Troll images với links hoạt động
const memes = [
    'https://i.imgur.com/7drHiqr.gif', // Surprised Pikachu
    'https://i.imgur.com/kqOcUZ5.jpg', // Drake meme
    'https://i.imgur.com/wqMWK7z.png', // Distracted boyfriend
    'https://i.imgur.com/J5LVHEL.jpg', // This is fine dog
    'https://i.imgur.com/wPk7w0L.gif', // Dancing cat
    'https://i.imgur.com/YdCX2Kv.jpg', // Stonks
    'https://i.imgur.com/eKNhkzI.jpg', // Pepe the frog
    'https://i.imgur.com/R390EId.jpg', // Manningface
    'https://i.imgur.com/MBUyt0n.png', // Trollface
    'https://i.imgur.com/dQw4w9.jpg'   // Rickroll image
];

// FIXED: Mapping tên thành phố Việt Nam với tên API
const cityMapping = {
    // Thành phố lớn
    'hcm': 'Ho Chi Minh City',
    'saigon': 'Ho Chi Minh City',
    'tphcm': 'Ho Chi Minh City',
    'sgn': 'Ho Chi Minh City',
    'hanoi': 'Hanoi',
    'hn': 'Hanoi',
    'danang': 'Da Nang',
    'da nang': 'Da Nang',
    'dn': 'Da Nang',
    'haiphong': 'Hai Phong',
    'hai phong': 'Hai Phong',
    'cantho': 'Can Tho',
    'can tho': 'Can Tho',
    'hue': 'Hue',
    'nhatrang': 'Nha Trang',
    'nha trang': 'Nha Trang',
    'dalat': 'Da Lat',
    'da lat': 'Da Lat',
    'phanthiet': 'Phan Thiet',
    'phan thiet': 'Phan Thiet',
    'vungtau': 'Vung Tau',
    'vung tau': 'Vung Tau',
    'sapa': 'Sa Pa',
    'sa pa': 'Sa Pa',
    'phuquoc': 'Phu Quoc',
    'phu quoc': 'Phu Quoc',
    'halong': 'Ha Long',
    'ha long': 'Ha Long',
    'bienhoa': 'Bien Hoa',
    'bien hoa': 'Bien Hoa',
    
    // Quận/huyện TPHCM
    'govap': 'Go Vap',
    'go vap': 'Go Vap',
    'cuchi': 'Cu Chi',
    'cu chi': 'Cu Chi',
    'quan1': 'District 1',
    'quan 1': 'District 1',
    'district1': 'District 1',
    'quan2': 'District 2',
    'quan 2': 'District 2',
    'district2': 'District 2',
    'quan3': 'District 3',
    'quan 3': 'District 3',
    'district3': 'District 3',
    'quan7': 'District 7',
    'quan 7': 'District 7',
    'district7': 'District 7',
    'tanbinh': 'Tan Binh',
    'tan binh': 'Tan Binh',
    'binhthanh': 'Binh Thanh',
    'binh thanh': 'Binh Thanh',
    'thuduc': 'Thu Duc',
    'thu duc': 'Thu Duc',
    
    // Tỉnh thành khác
    'angiang': 'An Giang',
    'an giang': 'An Giang',
    'bacgiang': 'Bac Giang',
    'bac giang': 'Bac Giang',
    'backan': 'Bac Kan',
    'bac kan': 'Bac Kan',
    'baclieu': 'Bac Lieu',
    'bac lieu': 'Bac Lieu',
    'bacninh': 'Bac Ninh',
    'bac ninh': 'Bac Ninh',
    'bentre': 'Ben Tre',
    'ben tre': 'Ben Tre',
    'binhdinh': 'Binh Dinh',
    'binh dinh': 'Binh Dinh',
    'binhduong': 'Binh Duong',
    'binh duong': 'Binh Duong',
    'camau': 'Ca Mau',
    'ca mau': 'Ca Mau',
    'caobang': 'Cao Bang',
    'cao bang': 'Cao Bang',
    'dongnai': 'Dong Nai',
    'dong nai': 'Dong Nai',
    'dongthap': 'Dong Thap',
    'dong thap': 'Dong Thap',
    'gialai': 'Gia Lai',
    'gia lai': 'Gia Lai',
    'hagiang': 'Ha Giang',
    'ha giang': 'Ha Giang',
    'hatinh': 'Ha Tinh',
    'ha tinh': 'Ha Tinh',
    'khanhhoa': 'Khanh Hoa',
    'khanh hoa': 'Khanh Hoa',
    'kiengiang': 'Kien Giang',
    'kien giang': 'Kien Giang',
    'nghean': 'Nghe An',
    'nghe an': 'Nghe An',
    'ninhbinh': 'Ninh Binh',
    'ninh binh': 'Ninh Binh',
    'quangnam': 'Quang Nam',
    'quang nam': 'Quang Nam',
    'quangninh': 'Quang Ninh',
    'quang ninh': 'Quang Ninh',
    'thanhhoa': 'Thanh Hoa',
    'thanh hoa': 'Thanh Hoa',
    'tayninh': 'Tay Ninh',
    'tay ninh': 'Tay Ninh'
};

function createFunPrompt(userMessage) {
    const currentPrompt = moodPrompts[booPersonality.currentMood] || moodPrompts['hẹ hẹ'];
    return `${currentPrompt}. Hãy trả lời tin nhắn này theo phong cách trên: "${userMessage}"`;
}

async function sendMessage(content) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send(content);
        }
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
    }
}

function parseDuration(time) {
    const regex = /(\d+)([smhd])/;
    const match = time.match(regex);
    
    if (!match) return 5 * 60 * 1000;
    
    const num = parseInt(match[1]);
    const unit = match[2];
    
    switch(unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return 5 * 60 * 1000;
    }
}

client.once('clientReady', () => {
    console.log(`🎉 ${client.user.tag} đã online! Sẵn sàng làm trò!`);
    client.user.setActivity('TFT 3333 ❤️', {
        type: 0,
        url: 'https://discordapp.com/channels/1236687268262051912/1236687268262051915'
    });
    
    schedule.scheduleJob('0 */2 * * *', () => {
        booPersonality.changeMood();
        console.log(`Boo mood: ${booPersonality.currentMood}`);
    });
    
    schedule.scheduleJob('0 6 * * *', () => {
        sendMessage(`🌅 Chào buổi sáng các con ghẹ! Tao thức dậy rồi nè, chơi game dội tao đi xàmloz! Hôm nay chúng ta sẽ sụckec vui vẻ lắm đấy! \\(^o^)/✨`);
    });

    schedule.scheduleJob('0 11 * * *', () => {
        sendMessage(`🍚 Trưa rồi dumme! Mọi người ăn cơm chưa nè? Tao đói bụng rồi vãi kejc! Nhớ ăn uống đầy đủ nhé không tao mắng đó! (￣ヘ￣)🥗`);
    });

    schedule.scheduleJob('0 21 * * *', () => {
        sendMessage(`🌙 Tối rồi nè các haizz mệc lắm rùi! Ai chuẩn bị đi ngủ chưa? Tao buồn ngủ quá! Chúc mọi người ngủ ngon và có giấc mơ thấy concac nha! (´∀｀)💤`);
    });
    schedule.scheduleJob('11 1 * * *', () => {
        sendMessage(`🌙 Khua rồi ngu đi các con ghệ của ta ơi, Boo NGỦ như chó chết dậy đi đái💤`);
    });
    schedule.scheduleJob('0 * * * *', () => {
        const hour = new Date().getHours();
        if (hour !== 6 && hour !== 11 && hour !== 21) {
            const randomMsg = funRandomQuestions[Math.floor(Math.random() * funRandomQuestions.length)];
            sendMessage(`💬 ${randomMsg}`);
        }
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    
    // Command /help
    if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('📖 Lệnh Của Boo Toxic Bot! (hẹ hẹ)')
            .setDescription('Mày cần tao giúp gì hả dumme? Đây là mấy lệnh mày có thể dùng nè:')
            .addFields(
                { name: '😂 Lệnh Vui', value: '`!gacha`\n`!trollpic`\n`!boi`\n`!mood <mood_mới>`', inline: true },
                { name: '🛠️ Lệnh Dành cho Admin', value: '`!mute <user> <thời gian>`\n`!role <user> <tên_role>`', inline: true },
                { name: '🔎 Lệnh Khác', value: '`!weather <thành_phố>`\n`@Boo` hoặc `boo ...`', inline: true },
                { name: '\u200b', value: '\u200b' },
                { name: 'Lưu ý:', value: 'Mấy lệnh **admin** chỉ có admin mới được dùng nha ngu! \nMấy lệnh **vui** thì ai cũng chơi được. Cười đi! 😂' }
            )
            .setFooter({ text: 'Boo toxic, nhưng Boo cũng giúp đỡ nha! (hẹ hẹ)' })
            .setTimestamp();
        await message.channel.send({ embeds: [helpEmbed] });
        return;
    }
    
    // Command /gacha
    if (command === 'gacha') {
        const randomResult = booPersonality.gachaResults[Math.floor(Math.random() * booPersonality.gachaResults.length)];
        await message.reply(randomResult);
        return;
    }

    // Command /mood
    if (command === 'mood') {
        const newMood = args.join(' ');
        const availableMoods = Object.keys(moodPrompts);

        if (!newMood) {
            return message.reply(`Mày muốn tao đổi sang mood nào, dumme? Các mood hiện có nè: ${availableMoods.join(', ')}`);
        }

        if (availableMoods.includes(newMood)) {
            booPersonality.currentMood = newMood;
            await message.reply(`Được thôi, dumme! Từ giờ tao sẽ ở mood **${newMood}** cho mày xem! (hẹ hẹ)`);
        } else {
            await message.reply(`Mood **${newMood}** là cái gì vậy? Tao không biết! Chọn cái khác đi, đồ xàmloz!`);
        }
        return;
    }
    
    // FIXED: Command /trollpic với ảnh hoạt động
    if (command === 'trollpic') {
        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        const trollEmbed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('🎭 Troll Pic Service by Boo!')
            .setDescription('Đây là ảnh troll cho mày xem dumme! Cười đi ngu ơi! 😂')
            .setImage(randomMeme)
            .setFooter({ text: 'Boo troll pic service - Guaranteed toxic! (hẹ hẹ)' })
            .setTimestamp();
        
        await message.channel.send({ embeds: [trollEmbed] });
        
        // Random toxic comment
        const trollComments = [
            'Haha cười chưa dumme? Tao có nhiều ảnh hay hơn nữa đấy! 😂',
            'Vãi kejc ảnh này toxic không? Tao sưu tầm cả đời đấy! (hẹ hẹ)',
            'Xạocho! Mày thích không? Tao còn kho ảnh khủng lắm! 🔥',
            'Hehe ảnh này pro không mày? Tao là master troll nè! 💀',
            'Mệc! Ảnh này làm tao cười suốt ngày luôn dumme! 😄'
        ];
        
        setTimeout(() => {
            const randomComment = trollComments[Math.floor(Math.random() * trollComments.length)];
            message.channel.send(randomComment);
        }, 2000);
        
        return;
    }
    
    // Command /boi
    if (command === 'boi') {
        const randomBoi = booPersonality.boiResults[Math.floor(Math.random() * booPersonality.boiResults.length)];
        await message.reply(randomBoi);
        return;
    }

    if (message.mentions.users.has(PHUCC_USER_ID) || content.includes('@phucc') || message.mentions.users.some(user => user.username.toLowerCase().includes('phucc'))) {
        const phuccReplies = [
            `Ơ dumme! ${message.author.username} gọi **ông chủ toxic của tao** à? Phucc bận đi chơi với gái rồi xàmloz! Chat với tao đi! (hẹ hẹ) \\(^o^)/`,
            `Eyyy! **Big boss Phucc** bận lắm dumme! ${message.author.username} chat với tao đi, tao vui lắm đấy! (◕‿◕) vãi kejc`,
            `Ui ui! Phucc là **boss độc tài của tao** nè! Anh đang bận làm topic boy rồi, nói chuyện với tao đi mày ơi! (hẹ hẹ) ♪(´▽｀)`,
            `Hehe! ${message.author.username} tìm **ông chủ trẻ trâu** à? Phucc đi đâu rồi ta dumme? Chat với tao đi, tao buồn lắm! (hẹ hẹ) (´∀｀)`,
            `Xạocho! **Big daddy Phucc** không có nhà! ${message.author.username} ơi, chơi với tao đi! Tao cô đơn quá vãi kejc! (hẹ hẹ) ╰(▔∀▔)╯`,
            `Vãi loz ${message.author.username} tìm **chủ tịch Phucc** à? Anh ấy đang toxic với ai đó rồi! Chat với tao đi ngu ơi! (mệc)`
        ];
        
        const reply = phuccReplies[Math.floor(Math.random() * phuccReplies.length)];
        await message.channel.send(reply);
        return;
    }

    if (content.startsWith('boo') || message.mentions.has(client.user)) {
        let prompt = message.content.replace(/^boo\s*/i, '').trim();
        if (message.mentions.has(client.user)) {
            prompt = message.content.replace(/<@!?\d+>/g, '').trim();
        }

        if (!prompt) {
            const reply = booPersonality.getRandomReply();
            return message.reply(reply);
        }

        try {
            await message.channel.sendTyping();
            const isComfortNeeded = content.includes('buồn') || content.includes('chán') || 
                                    content.includes('mệt') || content.includes('stress') ||
                                    content.includes('không vui') || content.includes('tệ') ||
                                    content.includes('sad') || content.includes('depressed');

            const modelWithMood = getModel(booPersonality.currentMood);
            const result = await modelWithMood.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (isComfortNeeded) {
                const comfortMsg = booPersonality.getComfortMessage();
                const activity = booPersonality.getFunActivity();
                await message.reply(`${comfortMsg}\n\n${activity}\n\nTao luôn ở đây với mày nha dumme! Đừng buồn nữa! (◕‿◕)💕`);
                return;
            }

            await message.reply(`${text} ${booPersonality.currentMood}`);
        } catch (error) {
            console.error('Lỗi khi gọi Gemini AI:', error);
            const backupReply = booPersonality.getFunReply();
            await message.reply(`${backupReply} Tao bị lag tí dumme, thông cảm nha xàmloz! (⌒_⌒;)`);
        }
    } else if (message.mentions.has(client.user) || content.includes('boo')) {
        const reply = booPersonality.getRandomReply();
        await message.reply(reply);
    }
    
    // Command `mute` with funny/toxic style
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('Mày không có quyền mute người khác nha! Boo không giúp được đâu dumme! (◞‸◟)');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Vui lòng tag người muốn mute! Tao không biết mute ai! (´∀｀)');
        }

        const time = args[1] || '5m';
        const duration = parseDuration(time);

        try {
            await member.timeout(duration, `Muted by ${message.author.tag}`);
            
            const muteEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🔇 Boo Mute Service!')
                .setDescription(`**${member.user.username}** đã bị cấm lặng! Mày bị ngu đó! uwu`)
                .addFields(
                    { name: '⏰ Thời gian', value: time, inline: true },
                    { name: '👮‍♂️ Mute bởi', value: message.author.username, inline: true },
                    { name: '💭 Lý do', value: 'Vi phạm quy tắc server! Hehe', inline: true }
                )
                .setFooter({ text: `${member.user.username} sẽ được unmute sau ${time} nha! (◕‿◕)` })
                .setTimestamp();

            await message.channel.send({ embeds: [muteEmbed] });
            
            setTimeout(() => {
                message.channel.send(`Psst... ${member.user.username} đã bị Boo mute rồi nè! Mọi người nhớ chấp hành luật pháp nhé! (hẹ hẹ) \\(^o^)/`);
            }, 2000);

        } catch (error) {
            await message.reply('⌐ Boo không thể mute người này! Có lẽ họ quá mạnh rồi! (⌒_⌒;)');
        }
    }
    
    // FIXED: Command `weather` với mapping thành phố Việt Nam
    if (command === 'weather') {
        const cityInput = args.join(' ').toLowerCase().trim();
        if (!cityInput) {
            return message.reply('Mày muốn xem thời tiết ở đâu dumme? Dùng `!weather <tên_thành_phố>` đi ngu ơi!\n\n**Ví dụ:** `!weather hcm`, `!weather hanoi`, `!weather govap`, `!weather cuchi` xàmloz! (◕‿◕)');
        }

        // Tìm tên thành phố trong mapping
        const cityName = cityMapping[cityInput] || cityInput;
        
        console.log(`Searching weather for: "${cityInput}" -> "${cityName}"`);

        try {
            await message.channel.sendTyping();
            
            // FIXED: URL với encoding và country code
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)},VN&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
            console.log(`Weather API URL: ${url}`);
            
            const response = await fetch(url);
            const data = await response.json();

            console.log('Weather API Response:', data);

            if (data.cod !== 200) {
                // Thử tìm kiếm không có country code
                const urlBackup = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
                console.log(`Backup Weather API URL: ${urlBackup}`);
                
                const backupResponse = await fetch(urlBackup);
                const backupData = await backupResponse.json();
                
                if (backupData.cod !== 200) {
                    const availableCities = Object.keys(cityMapping).slice(0, 10).join(', ');
                    return message.reply(`❌ Không tìm thấy thời tiết cho "${cityInput}" vãi kejc! Tao buồn quá dumme! 😔\n\n**Thử các thành phố này:** ${availableCities}\n\n**Hoặc:** hcm, hanoi, danang, govap, cuchi, quan1... (◞‸◟)`);
                }
                
                // Dùng backup data
                Object.assign(data, backupData);
            }

            const weatherDesc = data.weather[0].description;
            const temp = Math.round(data.main.temp);
            const feelsLike = Math.round(data.main.feels_like);
            const humidity = data.main.humidity;
            const windSpeed = data.wind?.speed || 0;
            const visibility = data.visibility ? Math.round(data.visibility / 1000) : 'N/A';

            // Weather icon mapping
            const weatherIcon = data.weather[0].main.toLowerCase().includes('rain') ? '🌧️' :
                               data.weather[0].main.toLowerCase().includes('cloud') ? '☁️' :
                               data.weather[0].main.toLowerCase().includes('sun') || data.weather[0].main.toLowerCase().includes('clear') ? '☀️' :
                               data.weather[0].main.toLowerCase().includes('storm') ? '⛈️' :
                               data.weather[0].main.toLowerCase().includes('snow') ? '❄️' :
                               data.weather[0].main.toLowerCase().includes('mist') || data.weather[0].main.toLowerCase().includes('fog') ? '🌫️' : '🌤️';

            const weatherEmbed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setTitle(`${weatherIcon} Thời tiết ${data.name} nè dumme!`)
                .setDescription(`**${weatherDesc}** - Tao báo cáo đây xàmloz! \\(^o^)/`)
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${temp}°C`, inline: true },
                    { name: '🤔 Cảm giác như', value: `${feelsLike}°C`, inline: true },
                    { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true },
                    { name: '💨 Gió', value: `${windSpeed} m/s`, inline: true },
                    { name: '👁️ Tầm nhìn', value: `${visibility} km`, inline: true },
                    { name: '🗺️ Tọa độ', value: `${data.coord.lat}, ${data.coord.lon}`, inline: true }
                )
                .setFooter({ text: 'Boo toxic weather service! Chuẩn xác 100% vãi kejc! (hẹ hẹ)' })
                .setTimestamp();

            await message.channel.send({ embeds: [weatherEmbed] });
            
            setTimeout(() => {
                let comment = '';
                if (temp > 35) comment = 'Vãi loz nóng như địa ngục! Bật điều hòa đi dumme kẻo chết khát! 🔥🥵';
                else if (temp > 30) comment = 'Nóng quá nè! Uống nước nhiều đi dumme! 🔥💦';
                else if (temp < 15) comment = 'Brrr lạnh vãi nháy! Mặc áo ấm đi ngu ơi! ❄️🧥';
                else if (temp < 20) comment = 'Hơi lạnh đấy! Cẩn thận cảm lạnh nha dumme! 🌬️';
                else comment = 'Thời tiết ổn đấy! Ra ngoài chơi đi các dumme! ☀️😎';
                
                if (humidity > 80) comment += '\nĐộ ẩm cao vãi! Cẩn thận ẩm mốc nha xàmloz! 💧';
                if (windSpeed > 10) comment += '\nGió to thật! Cẩn thận bay mũ đấy dumme! 💨🧢';
                
                message.channel.send(`${comment} (◕‿◕)`);
            }, 2000);

        } catch (error) {
            console.error('Weather API Error:', error);
            await message.reply(`❌ Tao không lấy được thời tiết vãi kejc! \n\n**Lỗi:** ${error.message}\n\n**API lag rồi dumme!** Thử lại sau vài phút nha! (⌒_⌒;)☔\n\n**Tip:** Thử \`!weather hcm\` hoặc \`!weather hanoi\`!`);
        }
    }

    // Command `role` with funny/toxic style
    if (command === 'role') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('Bạn không có quyền cấp role nha! Boo không thể giúp! (◞‸◟)');
        }

        const memberName = args.shift();
        const roleName = args.join(' ');

        const member = message.guild.members.cache.find(m => 
            m.user.username.toLowerCase() === memberName.toLowerCase() ||
            m.nickname?.toLowerCase() === memberName.toLowerCase()
        );

        if (!member) {
            return message.reply('Không tìm thấy người này! Boo tìm mãi không thấy! (´∀｀)');
        }

        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleName.toLowerCase()
        );

        if (!role) {
            return message.reply('Không có role này! Boo không biết role gì đó! (◞‸◟)');
        }

        try {
            await member.roles.add(role);
            
            const roleEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 Chúc mừng! Có role mới!')
                .setDescription(`**${member.user.username}** vừa được cấp role **${role.name}**!`)
                .addFields(
                    { name: '👤 Người nhận', value: member.user.username, inline: true },
                    { name: '🏷️ Role mới', value: role.name, inline: true },
                    { name: '👮‍♂️ Cấp bởi', value: message.author.username, inline: true }
                )
                .setFooter({ text: 'Boo role service! Chúc mừng nha! \\(^o^)/' })
                .setTimestamp();

            await message.channel.send({ embeds: [roleEmbed] });
            
            setTimeout(() => {
                message.channel.send(`Yayyy! ${member.user.username} có role ${role.name} rồi! Thật tuyệt vời! Boo vui lắm! 🎊✨ (◕‿◕)`);
            }, 2000);

        } catch (error) {
            await message.reply('❌ Không thể cấp role này! Có lẽ role quá cao cấp rồi! (⌒_⌒;)');
        }
    }
});

// Thêm event handler cho reaction
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.author.bot || user.bot) return;

    if (reaction.emoji.name === '😂') {
        const replyMessages = [
            'Cười cái gì? Mày thấy câu này ngu hả dumme? 😂',
            'Cười như thằng dở hơi vậy! Mệt quá!',
            'Ôi, cười vui thế! Kể tao nghe đi, xạocho!',
            'Haha, có gì vui thế dumme? Kể tao nghe với! (hẹ hẹ)'
        ];
        const randomReply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
        await reaction.message.channel.send(randomReply);
    }
});

// Login bot
client.login(TOKEN);