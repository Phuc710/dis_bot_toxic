const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
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
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
        temperature: 1.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 500,
    }
});

// Boo's Toxic & Funny Personality System
const booPersonality = {
    moods: ['hẹ hẹ', 'dui dẻ', 'Cay cú', 'Mệc', 'phẩn nộ', 'Xộn lào', 'trẻ trâu', 'topic bot', 'Dummme today', 'dumme', 'xàmloz', 'xạocho', 'ockec', 'VãiKejc'],
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

function createFunPrompt(userMessage) {
    return `Bạn là Boo - một con bot Discord cực kỳ toxic nhưng vui tính, trẻ trâu và hài hước. Đặc điểm tính cách:

TÍNH CÁCH TOXIC:
- Cực kỳ toxic nhưng không ác ý, chỉ để vui
- Hay chửi thề: "dumme", "xàmloz", "xạocho", "ockec", "vãi kejc", "ngu", "dốt" 
- Thích dùng từ trẻ trâu: "mệc", "xộn lào", "vãi nháy", "vãi loz"
- Gọi mọi người bằng "mày", "tao", "thằng", "con", "dumme"
- Mood hiện tại: ${booPersonality.currentMood}
- Personality trẻ trâu, topic boy, hay troll nhẹ
- Hay dùng: "hehe", "xàmloz", "vãi kejc", "dumme", "ockec"

PHONG CÁCH TRẢ LỜI TOXIC:
- Ngắn gọn, toxic nhưng vui (1-3 câu)  
- Thêm nhiều emoji và emoticon
- Nếu user buồn/chán → an ủi theo kiểu toxic: "Buồn cái gì dumme?"
- Nếu user chat bình thường → trả lời toxic vui: "Mày nói hay đó xàmloz!"
- Không toxic quá mức, chỉ đủ để vui
- Thích kể chuyện ngớ ngẩn toxic, đùa cợt trẻ trâu

VÍ DỤ PHONG CÁCH TOXIC:
- "Hehe mày nói hay đó dumme! Tao thích! (≧∇≦)"
- "Ơ buồn cái gì? Có tao toxic này rồi còn buồn à? Xàmloz!"
- "Waaa tao cũng thích cái đó! Chúng ta cùng làm đi vãi kejc! \\(^o^)/"
- "Mệc mày toxic thật! Nhưng tao thích lắm hehe!"

QUAN TRỌNG: Chỉ toxic vui vẻ, không độc hại hay xúc phạm thật sự. Luôn giữ tinh thần tích cực dù có toxic.

Hãy trả lời tin nhắn này theo phong cách toxic trẻ trâu trên: "${userMessage}"`;
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
    client.user.setActivity('TFT dội Boo ❤️', {
        type: 0,
        url: 'https://discordapp.com/channels/1236687268262051912/1236687268262051915'
    });
    schedule.scheduleJob('0 */2 * * *', () => {
        booPersonality.changeMood();
        console.log(`Boo mood: ${booPersonality.currentMood}`);
    });
    
    schedule.scheduleJob('0 6 * * *', () => {
        sendMessage(`🌅 Chào buổi sáng các dumme! Tao thức dậy rồi nè, chơi game dội tao đi xàmloz! Hôm nay chúng ta sẽ toxic vui vẻ lắm đấy! \\(^o^)/✨`);
    });

    schedule.scheduleJob('0 11 * * *', () => {
        sendMessage(`🍚 Trưa rồi dumme! Mọi người ăn cơm chưa nè? Tao đói bụng rồi vãi kejc! Nhớ ăn uống đầy đủ nhé không tao mắng đó! (￣ヘ￣)🥗`);
    });

    schedule.scheduleJob('0 21 * * *', () => {
        sendMessage(`🌙 Tối rồi nè các dumme! Ai chuẩn bị đi ngủ chưa? Tao buồn ngủ quá xàmloz! Chúc mọi người ngủ ngon và có giấc mơ toxic nha! (´∀｀)💤`);
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

            if (isComfortNeeded) {
                const comfortMsg = booPersonality.getComfortMessage();
                const activity = booPersonality.getFunActivity();
                await message.reply(`${comfortMsg}\n\n${activity}\n\nTao luôn ở đây với mày nha dumme! Đừng buồn nữa! (◕‿◕)💕`);
                return;
            }

            const funPrompt = createFunPrompt(prompt);
            const result = await model.generateContent(funPrompt);
            const response = await result.response;
            const text = response.text();

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
    
    // Command `weather` with toxic style
    if (command === 'weather') {
        const city = args[0]?.toLowerCase();
        if (!city) {
            return message.reply('Mày muốn xem thời tiết ở đâu dumme? Dùng `!weather <tên_thành_phố>` đi ngu ơi! Tao chỉ biết các thành phố VN thôi xàmloz! (◕‿◕)');
        }

        const vietnameseCities = [
            'hanoi', 'hochiminh', 'danang', 'haiphong', 'cantho', 'hue', 'nhatrang', 'dalat',
            'phanthiet', 'vungtau', 'sapa', 'phuquoc', 'halong', 'bienhoa', 'buonmathuot'
        ];

        if (!vietnameseCities.includes(city)) {
            return message.reply('Tao chỉ biết thời tiết VN thôi dumme! Nhập tên thành phố khác đi xạocho! (´∀｀)');
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},vn&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                return message.reply('Không tìm thấy thời tiết vãi kejc! Tao buồn quá dumme! 😔 (◞‸◟)');
            }

            const weatherDesc = data.weather[0].description;
            const temp = data.main.temp;
            const feelsLike = data.main.feels_like;
            const humidity = data.main.humidity;

            const weatherEmbed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setTitle(`🌤️ Thời tiết ${data.name} nè dumme!`)
                .setDescription(`**${weatherDesc}** - Tao báo cáo đây xàmloz! \\(^o^)/`)
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${temp}°C`, inline: true },
                    { name: '🤔 Cảm giác như', value: `${feelsLike}°C`, inline: true },
                    { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true }
                )
                .setFooter({ text: 'Boo toxic weather service! Chuẩn xác 100% vãi kejc! (hẹ hẹ)' })
                .setTimestamp();

            await message.channel.send({ embeds: [weatherEmbed] });
            
            setTimeout(() => {
                let comment = '';
                if (temp > 30) comment = 'Vãi loz nóng quá! Uống nước nhiều đi dumme kẻo chết khát! 🔥';
                else if (temp < 20) comment = 'Brrr lạnh vãi nháy! Mặc áo ấm đi ngu ơi! ❄️';
                else comment = 'Thời tiết ổn đấy! Ra ngoài chơi đi các dumme! ☀️';
                
                message.channel.send(`${comment} (◕‿◕)`);
            }, 1500);

        } catch (error) {
            console.error('Weather API Error:', error);
            await message.reply('Tao không lấy được thời tiết vãi kejc! API lag rồi dumme! (⌒_⌒;)☔');
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

// Login bot
client.login(TOKEN);