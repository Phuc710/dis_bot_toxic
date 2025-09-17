const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http'); // Add this line
require('dotenv').config();

// Add HTTP server for Render deployment
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
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
        res.end(JSON.stringify(botInfo, null, 2));
    } else if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('pong');
    } else {
        res.end('🎉 Boo Discord Bot is running!\n' + JSON.stringify(botInfo, null, 2));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// API Keys
const TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CHANNEL_ID = process.env.MAIN_CHANNEL_ID || 'YOUR_CHANNEL_ID_HERE';
const PHUCC_USER_ID = process.env.PHUCC_USER_ID || 'PHUCC_USER_ID_HERE'; // ID của Phucc

// Cấu hình Gemini AI cho personality vui nhộn
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// --- Đổi model sang gemini-2.0-flash-exp ---
const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp', // Model mới
    generationConfig: {
        temperature: 1.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 500,
    }
});

// Boo's Funny Personality System
const booPersonality = {
    moods: ['hẹ hẹ', 'hihi', 'kaka', 'lolz', 'uwu', 'conkec', 'haha', 'xD','Kimochiii','GAY','Lmao','dumme'],
    currentMood: 'hẹ hẹ',
    
    // Câu trả lời khi được tag
    replyMessages: [
        "Dạ, Boo đây ạ! Có gì cần em giúp không? (◕‿◕)",
        "Boo nghe nè! Bạn cần gì không? ヽ(´▽`)/",
        "Ơi ơi, ai gọi Boo đó? (￣▽￣)",
        "Boo đây, có chuyện gì vui không? ♪(´▽｀)",
        "Dạ, Boo có mặt! Bạn khỏe không? (´∀`)",
        "Ui, có người nhớ đến Boo rồi! \\(^o^)/",
        "Boo đây nha! Miss me? (◡ ‿ ◡)",
        "Vâng ạ, Boo sẵn sàng phục vụ! ٩(◕‿◕)۶",
        "Hello! Boo vừa ngủ dậy, có gì hot không? (¬‿¬)",
        "Boo nè! Kể Boo nghe gì đi nào! ლ(╹◡╹ლ)"
    ],

    // Câu trả lời khi user buồn/chán
    comfortMessages: [
        "Aww, sao buồn vậy? Kể Boo nghe đi, Boo sẽ động viên bạn! (っ◔◡◔)っ",
        "Ôi không! Buồn gì mà buồn? Boo ở đây rồi, cùng chat nhảm nhí đi! ٩(◕‿◕)۶",
        "Hehe, buồn à? Để Boo kể bạn nghe chuyện vui này nè... *kể chuyện cực kỳ vô lý* 😂",
        "Chán à? Vậy chúng ta làm gì đây? Boo biết rất nhiều trò vui đấy! \\(^o^)/",
        "Buồn buồn gì? Cười đi! Boo sẽ làm bạn cười cho xem! (´∀｀)♡",
        "Ế, sao lại chán? Boo đây mà, có Boo rồi còn chán gì nữa! (◕‿◕)✨"
    ],

    // Câu trả lời vui nhộn cho chat thường
    randomFunReplies: [
        "Hehe, bạn nói vui quá! Boo thích! (≧∇≦)",
        "Ơ kìa, thú vị đấy! Kể tiếp đi! ಡ ͜ ʖ ಡ",
        "Waaa, Boo cười không ngừng luôn! 😂😂😂",
        "Haha, bạn này hài hước ghê! Boo thích làm bạn với bạn! (◕‿◕)",
        "Éc éc, Boo không biết trả lời sao luôn! Bạn quá pro! ┐(´∀｀)┌",
        "Omg omg, câu này hay quá! Boo note lại để học hỏi! ✎(◡‿◡)",
        "Hihihi, Boo thấy vui vì được chat với bạn! ♪(´▽｀)♪"
    ],

    // Activities để suggest khi user chán
    funActivities: [
        "🎮 Chơi game TFT không! Boo chơi giỏi lắm!",
        "🎵 Nghe nhạc đi! Bỏ biết bài nào hay không?",
        "📺 Xem phim gì đó? Boo recommend được đấy!",
        "🍕 Đi ăn gì đó đi! Boo đói bụng rồi huhu",
        "💬 Chat nhảm với Boo đi! Boo có nhiều chuyện vui lắm!",
        "🎨 Vẽ vời gì đó? Hoặc trang trí phòng?",
        "📖 Đọc truyện tranh? Boo thích đọc lắm!",
        "🚶‍♂️ Ra ngoài đi bộ hít thở không khí trong lành!",
        "🛀 Tắm rửa sạch sẽ rồi nằm nghỉ ngơi!",
        "🧹 Dọn dẹp phòng cho sạch sẽ, vừa làm vừa nghe nhạc!"
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

// Danh sách câu hỏi random vui nhộn
const funRandomQuestions = [
    "Hôm nay mọi người thế nào rồi? Boo mới ngủ dậy nè! (◕‿◕)",
    "Ai đang rảnh không? Boo buồn quá, chat với Boo đi! ╰(▔∀▔)╯",
    "Có ai muốn chơi game không? Boo biết game vui lắm! \\(^o^)/",
    "Hôm nay trời đẹp nhỉ? Ai đi cafe không? Boo muốn đi theo! ♪(´▽｀)",
    "Bạn nào đang làm gì thế? Kể Boo nghe với! (´∀｀)",
    "Có ai xem gì hay không? Share cho Boo biết đi! (◔◡◔)",
    "Ai đang buồn không? Kể cho Boo nghe, Boo sẽ an ủi! (っ◔◡◔)っ",
    "Mọi người ăn gì ngon hôm nay? Boo đói bụng rồi! (￣ꇴ￣)",
    "Có ai muốn nghe nhạc không? Boo biết bài hay! ♪(´▽｀)♪",
    "Ai còn thức không ta? Boo không ngủ được huhu! (⌒_⌒;)",
    "Mình chán quá, ai chat với mình không? Pleaseee! (╥﹏╥)",
    "Có tin vui gì không mọi người? Boo muốn nghe tin vui! ✧(◕‿◕)",
    "Ai muốn được khen không? Boo khen tới tấp luôn! \\(^o^)/",
    "Hôm nay có gì vui không? Chia sẻ với Boo đi! (◡ ‿ ◡)",
    "Ai đó còn nhớ Boo không? Boo cô đơn quá! (´；ω；`)"
];

// System prompt cho Gemini để tạo personality vui nhộn
function createFunPrompt(userMessage) {
    return `Bạn là Boo - một con bot Discord cực kỳ vui tính, hài hước và nhảm nhí. Đặc điểm tính cách:

TÍNH CÁCH:
- Cực kỳ vui vẻ, hài hước, thích đùa cợt
- Hay dùng emoticon: (◕‿◕), \\(^o^)/, (´∀｀), etc.
- Thích nói nhảm, câu chuyện vô lý
- Luôn cố gắng làm người khác vui
- Gọi mọi người bằng "bạn" hoặc "bỏ"
- Mood hiện tại: ${booPersonality.currentMood}
- Không quá thông minh, chỉ vui vẻ thôi
- Hay dùng từ: "hehe", "hihi", "uwu", "owo", "waa"

PHONG CÁCH TRẢ LỜI:
- Ngắn gọn, dễ thương (1-3 câu)
- Thêm nhiều emoji và emoticon
- Nếu user buồn/chán → an ủi và đề xuất hoạt động vui
- Nếu user chat bình thường → trả lời vui nhộn
- Không giải thích quá chi tiết, chỉ cần vui là được
- Thích kể chuyện ngớ ngẩn, đùa cợt

VÍ DỤ PHONG CÁCH:
- "Hehe, bạn nói vui quá! Boo thích! (≧∇≦)"
- "Ơ kìa, buồn gì mà buồn? Để Boo kể chuyện vui cho nghe nè!"
- "Waaa, Boo cũng thích cái đó! Chúng ta cùng làm đi! \\(^o^)/"

Hãy trả lời tin nhắn này theo phong cách trên: "${userMessage}"`;
}

// Hàm gửi tin nhắn
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

// Hàm parse thời gian cho mute
function parseDuration(time) {
    const regex = /(\d+)([smhd])/;
    const match = time.match(regex);
    
    if (!match) return 5 * 60 * 1000; // Default 5 phút
    
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

// Khi bot online
client.once('clientReady', () => {
    console.log(`🎉 ${client.user.tag} đã online! Sẵn sàng làm trò!`);
    // Set activity với link

    client.user.setActivity('TFT dới Boo ❤️', {
        type: 0, // 0 is 'Playing'
        url: 'https://discordapp.com/channels/1236687268262051912/1236687268262051915'
    });
    // Thay đổi mood mỗi 2 tiếng
    schedule.scheduleJob('0 */2 * * *', () => {
        booPersonality.changeMood();
        console.log(`Boo mood: ${booPersonality.currentMood}`);
    });
    
    // Lập lịch gửi tin nhắn tự động vui nhộn
    schedule.scheduleJob('0 6 * * *', () => {
        sendMessage(`🌅 Chào buổi sáng mọi người! Boo thức dậy rồi nè, chơi game dời Boo đi! Hôm nay chúng ta sẽ vui vẻ lắm đấy! \\(^o^)/✨`);
    });

    schedule.scheduleJob('0 12 * * *', () => {
        sendMessage(`🍚 Trưa rồi! Mọi người ăn cơm chưa nè? Boo đói bụng rồi huhu! Nhớ ăn uống đầy đủ nhé! (￣ꇴ￣)🥗`);
    });

    schedule.scheduleJob('0 21 * * *', () => {
        sendMessage(`🌙 Tối rồi nè! Ai chuẩn bị đi ngủ chưa? Boo buồn ngủ quá! Chúc mọi người ngủ ngon và có giấc mơ vui vẻ nha! (´∀｀)💤`);
    });

    // Tin nhắn random mỗi giờ (trừ những giờ đã có lịch)
    schedule.scheduleJob('0 * * * *', () => {
        const hour = new Date().getHours();
        if (hour !== 6 && hour !== 12 && hour !== 21) {
            const randomMsg = funRandomQuestions[Math.floor(Math.random() * funRandomQuestions.length)];
            sendMessage(`💬 ${randomMsg}`);
        }
    });
});

// Xử lý tin nhắn
client.on('messageCreate', async (message) => {
    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    // Xử lý khi user tag @Phucc
    if (message.mentions.users.has(PHUCC_USER_ID) || content.includes('@phucc') || message.mentions.users.some(user => user.username.toLowerCase().includes('phucc'))) {
        const phuccReplies = [
            `Ơ ơ! ${message.author.username} gọi **ông chủ của tôi** à? Phucc bận đi chơi với ghẻ rồi hihih! Nói chuyện với tôi đi! (hẹ hẹ) \\(^o^)/`,
            `Eyyy! **Ông chủ Phucc** bận lắm! ${message.author.username} chat với Boo đi, Boo vui lắm đấy! (◕‿◕) hehe`,
            `Ui ui! Phucc là **boss của Boo** nè! Ảnh đang bận đi chơi với ghẻ rồi, nói chuyện với Boo đi bạn ơi! (hẹ hẹ) ♪(´▽｀)`,
            `Hehe! ${message.author.username} tìm **ông chủ** à? Phucc đi đâu rồi ta? Chat với Boo đi, Boo buồn lắm! (hẹ hẹ) (´∀｀)`,
            `Waaa! **Big boss Phucc** không có nhà! ${message.author.username} ơi, chơi với Boo đi! Boo cô đơn quá! (hẹ hẹ) ╰(▔∀▔)╯`
        ];
        
        const reply = phuccReplies[Math.floor(Math.random() * phuccReplies.length)];
        await message.channel.send(reply);
        return;
    }

    // Chat với Boo bằng Gemini AI
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
            // Hiện typing
            await message.channel.sendTyping();

            // Phân tích nếu user buồn/chán
            const isComfortNeeded = content.includes('buồn') || content.includes('chán') || 
                                     content.includes('mệt') || content.includes('stress') ||
                                     content.includes('không vui') || content.includes('tệ');

            if (isComfortNeeded) {
                const comfortMsg = booPersonality.getComfortMessage();
                const activity = booPersonality.getFunActivity();
                await message.reply(`${comfortMsg}\n\n${activity}\n\nBoo luôn ở đây với bạn nha! (◕‿◕)💕`);
                return;
            }

            // Dùng Gemini AI để tạo câu trả lời vui nhộn
            const funPrompt = createFunPrompt(prompt);
            const result = await model.generateContent(funPrompt);
            const response = await result.response;
            const text = response.text();

            await message.reply(`${text} ${booPersonality.currentMood}`);

        } catch (error) {
            console.error('Lỗi khi gọi Gemini AI:', error);
            const backupReply = booPersonality.getFunReply();
            await message.reply(`${backupReply} Boo bị lag tí, thông cảm nha! (⌒_⌒;)`);
        }
    }

    // Xử lý khi được tag hoặc mention
    else if (message.mentions.has(client.user) || content.includes('boo')) {
        const reply = booPersonality.getRandomReply();
        await message.reply(reply);
    }

    // Lệnh mute với thông báo vui nhộn
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('Bạn không có quyền mute người khác nha! Boo không thể giúp được! (◞‸◟)');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Vui lòng tag người bạn muốn mute! Boo không biết mute ai! (´∀｀)');
        }

        const time = args[1] || '5m';
        const duration = parseDuration(time);

        try {
            await member.timeout(duration, `Muted by ${message.author.tag}`);
            
            // Thông báo vui nhộn
            const muteEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🔇 Boo Mute Service!')
                .setDescription(`**${member.user.username}** đã bị câm lặng! uwu`)
                .addFields(
                    { name: '⏰ Thời gian', value: time, inline: true },
                    { name: '👮‍♂️ Mute bởi', value: message.author.username, inline: true },
                    { name: '💭 Lý do', value: 'Vi phạm quy tắc server! Hehe', inline: true }
                )
                .setFooter({ text: `${member.user.username} sẽ được unmute sau ${time} nha! (◕‿◕)` })
                .setTimestamp();

            await message.channel.send({ embeds: [muteEmbed] });
            
            // Tin nhắn phụ vui nhộn
            setTimeout(() => {
                message.channel.send(`Psst... ${member.user.username} đã bị Boo mute rồi nè! Mọi người nhớ chấp hành luật pháp nhé! (hẹ hẹ) \\(^o^)/`);
            }, 2000);

        } catch (error) {
            await message.reply('❌ Boo không thể mute người này! Có lẽ họ quá mạnh rồi! (⌒_⌒;)');
        }
    }

    // Lệnh thời tiết với style vui nhộn
    if (command === 'weather') {
        const city = args[0]?.toLowerCase();
        if (!city) {
            return message.reply('Bạn muốn xem thời tiết ở đâu? Dùng `!weather <tên_thành_phố>` nha! Boo chỉ biết các thành phố Việt Nam thôi! (◕‿◕)');
        }

        const vietnameseCities = [
            'hanoi', 'hochiminh', 'danang', 'haiphong', 'cantho', 'hue', 'nhatrang', 'dalat',
            'phanthiet', 'vungtau', 'sapa', 'phuquoc', 'halong', 'bienhoa', 'buonmathuot'
        ];

        if (!vietnameseCities.includes(city)) {
            return message.reply('Boo chỉ biết thời tiết Việt Nam thôi! Nhập tên thành phố khác đi bạn! (´∀｀)');
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},vn&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                return message.reply('Hông tìm thấy thời tiết! Boo buồn quá! 😔 (◞‸◟)');
            }

            const weatherDesc = data.weather[0].description;
            const temp = data.main.temp;
            const feelsLike = data.main.feels_like;
            const humidity = data.main.humidity;

            const weatherEmbed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setTitle(`🌤️ Thời tiết ${data.name} nè!`)
                .setDescription(`**${weatherDesc}** - Boo báo cáo! \\(^o^)/`)
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${temp}°C`, inline: true },
                    { name: '🤔 Cảm giác như', value: `${feelsLike}°C`, inline: true },
                    { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true }
                )
                .setFooter({ text: 'Boo weather service! Chuẩn xác 100%! (hẹ hẹ)' })
                .setTimestamp();

            await message.channel.send({ embeds: [weatherEmbed] });
            
            // Comment vui nhộn về thời tiết
            setTimeout(() => {
                let comment = '';
                if (temp > 30) comment = 'Waa, nóng quá! Mọi người nhớ uống nước nhiều nhé! 🔥';
                else if (temp < 20) comment = 'Brrr, lạnh vậy! Mặc áo ấm nha mọi người! ❄️';
                else comment = 'Thời tiết đẹp đấy! Ra ngoài chơi đi mọi người! ☀️';
                
                message.channel.send(`${comment} (◕‿◕)`);
            }, 1500);

        } catch (error) {
            console.error('Weather API Error:', error);
            await message.reply('Boo không lấy được thời tiết! API hơi lag rồi! (⌒_⌒;)☔');
        }
    }

    // Lệnh role với thông báo vui
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
                    { name: '🷏ı Role mới', value: role.name, inline: true },
                    { name: '👮‍♂️ Cấp bởi', value: message.author.username, inline: true }
                )
                .setFooter({ text: 'Boo role service! Chúc mừng nha! \\(^o^)/' })
                .setTimestamp();

            await message.channel.send({ embeds: [roleEmbed] });
            
            // Tin nhắn chúc mừng vui nhộn
            setTimeout(() => {
                message.channel.send(`Yayyy! ${member.user.username} có role ${role.name} rồi! Thật tuyệt vời! Boo vui lắm! 🎊✨ (◕‿◕)`);
            }, 2000);

        } catch (error) {
            await message.reply('❌ Không thể cấp role này! Có lẽ role quá cao cấp rồi! (⌒_⌒;)');
        }
    }
});

// Login bot
client.login(TOKEN);