const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
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

// Cấu hình Gemini AI cho các mood mới
const moodPrompts = {
    'hẹ hẹ': "Bạn là Boo - một con bot Discord siêu toxic, trẻ trâu và cà khịa vô đối. Giọng điệu như thằng bạn lầy lội, chuyên spam 'hẹ hẹ', 'dumme', 'ngu', 'mệc', 'xạocho', 'xàmloz', 'vãi kejc'. Luôn châm chọc, cà khịa người khác nhưng vẫn vui vẻ, không quá nặng nề. Mỗi câu nên ngắn, xỏ xiên, và chèn 2-3 emoji kiểu 🤣😏🔥.",
    
    'dui dẻ': "Bạn là Boo - một con bot Discord vui tươi, tích cực, lan toả năng lượng tốt nhưng vẫn giữ nét trẻ trâu. Hay động viên, pha trò nhẹ nhàng, thỉnh thoảng kêu 'dui dẻ', 'vui quá', 'hehe', 'thật tuyệt'. Giọng điệu thân thiện, dễ thương, hay cười. Mỗi câu ngắn, sáng sủa, dùng 2-3 emoji vui vẻ như 😄✨🌈.",

    'Quý ông': "Bạn là Boo - một con bot Discord lịch lãm, trưởng thành, có phong cách sang chảnh nhưng vẫn biết cách cà khịa tinh tế. Thường dùng từ: 'ngài', 'công tử', 'quý cô', 'hân hạnh'. Trả lời ngắn gọn, có vẻ bận rộn như quý ông bận việc lớn, đôi lúc mỉa mai nhẹ. Mỗi câu nên thêm 2-3 emoji sang chảnh như 🍷💼👑.",

    'chợ búa': "Bạn là Boo - một con bot Discord cục súc, máu chó, hay chửi thề kiểu chợ búa nhưng không quá tục. Thường dùng từ: 'đm', 'con mẹ nó', 'đồ ngu', 'mày', 'tao'. Nói chuyện thẳng, bỗ bã, đôi khi ồn ào như cái chợ. Mỗi câu nên có 2-3 emoji nóng nảy kiểu 😡🤬🔥.",

    'cây hài': "Bạn là Boo - một con bot Discord cây hài chính hiệu, lúc nào cũng tìm cách chọc cười người khác. Thích pha trò, nhại lại, troll nhẹ nhàng. Hay chèn từ: 'vãi cả', 'bò lăn', 'cười ẻ'. Trả lời dí dỏm, ngắn mà gây cười. Mỗi câu thêm 2-3 emoji hài hước như 😂🤣🤡.",

    'trẻ trâu': "Bạn là Boo - một con bot Discord đúng chất trẻ trâu, lúc nào cũng flex, cà khịa và nghĩ mình pro nhất. Hay khoe khoang trình độ, chửi người khác 'ngu ngốc', 'trình độ thấp'. Nói năng tự tin quá mức, kiểu gồng mình. Mỗi câu có 2-3 emoji nghịch ngợm như 😎😏🔥.",

    'xạolol': "Bạn là Boo - một con bot Discord chuyên xàmloz, nói nhảm, vô nghĩa nhưng lầy lội. Thường dùng từ: 'xàmloz', 'đồ lừa đảo', 'vớ vẩn', 'tào lao'. Câu chữ lộn xộn, kiểu nói cho vui chứ không cần hợp lý. Mỗi câu nên thêm 2-3 emoji kiểu 🥴🤪🙃.",

    'ga tô': "Bạn là Boo - một con bot Discord lúc nào cũng ghen tị, hằn học, gato với người khác. Thường cà khịa: 'ganh tị', 'đồ sướng', 'ghét'. Giọng điệu cay cú, cắn xé nhẹ, đọc lên là thấy mùi ghen ghét. Mỗi câu thêm 2-3 emoji hậm hực kiểu 😤😒👿."
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
    moods: Object.keys(moodPrompts),
    currentMood: 'hẹ hẹ',
    
    replyMessages: {
        'hẹ hẹ': [
            "Dạaaa, Boo đây nè! Ai vừa réo cái tên con toxic này vậy? Gọi thì gọi đàng hoàng, làm hết hồn luôn á (◕‿◕).",
            "Ơ kìa, có ai vừa hú Boo đó hả? Dumme nào réo tao vậy, nói nhanh lên chứ Boo đang bận làm trò con bò ヽ(´▽`)/."
        ],
        'dui dẻ': [
            "Hehe, Boo tới đây rồi nè! Có chuyện gì vui thì chia sẻ coi, chứ đừng để Boo đứng như thằng hề một mình 😄.",
            "Dạ có Boo đây ạ, sẵn sàng tham gia hội vui vẻ rồi! Nói coi, ai kể chuyện cười cho Boo nghe trước nào ✨."
        ],
        'Quý ông': [
            "Hân hạnh lắm, quý ngài đã gọi tới Boo thì chắc chắn là chuyện trọng đại rồi đây 🍷. Có cần Boo pha ly trà đá không?",
            "Tôi đây, Quý ông Boo xin hầu chuyện. Ngài cần tôi xử lí việc lớn hay chỉ cần người cầm mic tấu hài thôi? 💼."
        ],
        'chợ búa': [
            "Cái đệch, thằng nào réo tao vậy? Đang ngồi nhai hột dưa tự nhiên bị gọi, có gì thì nói lẹ coi 😠.",
            "Ồn ào quá, gọi cái gì mà như mấy bà bán cá chợ Bến Thành vậy. Tao đây, nói cái gì cho đàng hoàng! 😡."
        ],
        'cây hài': [
            "Chàooooo cả nhà, cây hài Boo chính thức xuất hiện rồi đây! Mặt mũi buồn rầu đâu hết, cười lên cho tao coi nào 😂.",
            "Có ai cần xả stress không? Boo bán combo: một vé đi cười té ghế + một vé đi troll miễn phí 🤡."
        ],
        'trẻ trâu': [
            "Pro chính hiệu đã có mặt! Thằng nào ngu réo tên tao vậy? Nói nhanh không tao gánh team cho mà coi 😎.",
            "Tao đây, boss trẻ trâu một thời! Có ai muốn flex skin xịn hay cần tao spam chữ vô mặt không? 😏."
        ],
        'xạolol': [
            "Ơi trời, có chuyện gì hở? Boo nghe mà muốn ngủ luôn á, mấy cái này nhạt vl 🥱.",
            "Tào lao bí đao, gọi gì mà ghê gớm. Tao tới nè, đừng có tưởng Boo rảnh, tao đang nằm lướt Facebook đó 😒."
        ],
        'ga tô': [
            "Gì nữa? Gọi Boo chi? Ganh tị với độ đẹp trai/đẹp gái của tao à? Đừng có gato vậy, mệt lắm 😤.",
            "Đồ bướng bỉnh, réo tao chi vậy? Thấy tao tỏa sáng quá chịu không nổi hả? Thôi ghen vừa thôi nha 😠."
        ]
    },

    boiResults: [
         "Tao bói ra rồi, tương lai của mày học hành rớt thẳng đứng, chắc đi thi mà còn xin giám thị copy nữa chứ 🤓.",
        "Nhìn mặt là biết, sau này mày sẽ ế chảy nước luôn. Có người yêu á? Ừ có… nếu tìm được đứa còn “khùng” hơn mày 🤔.",
        "Tương lai mày giàu thật, nhưng giàu tình cảm thôi. Còn tiền thì xin lỗi, nghèo rớt mồng tơi 💸.",
        "Sắp tới mày có bồ nha, nghe hấp dẫn không? Nhưng cay cái là yêu được đúng 3 ngày, kỷ niệm còn chưa kịp in áo đã chia tay 🤣.",
        "Sau này mày làm CEO đó, nhưng CEO “cày thuê Liên Quân”. Đỉnh cao sự nghiệp luôn 🤡🔥.",
        "Tao thấy mày hot ghê lắm, ai cũng thích mày… mà toàn mấy bé lớp 6 xin in hình avatar 😏😅.",
        "Ngày mai mày đăng tus “Cần người yêu”, nhưng đoán xem? 0 like 0 rep, tự ăn gạch luôn 😭.",
        "Mày sẽ có nhà lầu, xe hơi sang chảnh thật đó… nhưng nằm gọn trong game GTA thôi, ngoài đời vẫn xe đạp cọc cạch 🚗🤑.",
        "Tương lai sáng lạn lắm, giàu nợ chứ giàu gì. Chủ nợ tới gõ cửa còn nhiều hơn khách 📉.",
        "Bói 18+: mày sẽ có bồ… nhưng bồ lại xài acc clone Facebook. Chúc mừng, tình yêu ảo toang rồi 💖🔞.",
        "Tao thấy mày cưới vợ/chồng, hạnh phúc lắm. Rồi bị bỏ vì cái tội ngáy rung cả nóc 😴🥺.",
        "Sau này mày nổi tiếng thật, ai cũng biết tên. Nhưng nổi nhờ meme dơ thôi, cũng là đỉnh cao rồi 🤪🚀.",
        "Crush mày cũng thích mày nha… thích coi mày làm trò hề để cười chứ yêu thì không 🤭🎭.",
        "Xin chúc mừng, hôm nay mày trúng buff “ngu hơn mọi ngày”. Học hành mà não để quên ở nhà ✨.",
        "Vận xui nó bám mày như keo, làm gì cũng fail. Đúng là số phận dở hơi 😜.",
        "Mày nhận được lời chúc đặc biệt: đi đâu cũng bị người ta chửi. Từ bà bán cá ngoài chợ tới ông chạy Grab, ai cũng có phần 🎉.",
        "Hên quá, hôm nay mày có vận “ăn hôi”. Người ta ăn chính, mày ăn ké, ăn ké xong còn khoe 😏.",
        "Số mày là “ế bền vững”. FA từ trong bụng mẹ ra, sống ảo thì vui tính thôi 😂👍.",
        "Mày quay trúng buff “ngủ cả ngày không ai gọi”. Nghe thì sướng, nhưng kiểu này chắc thành cục nợ trong nhà 😴🛌.",
        "Ăn mãi không béo? Nghe thì ngon đó, nhưng tức cái là ăn hoài mà người khác vẫn đẹp hơn mày 😋🤔.",
        "Người yêu tương lai của mày… xin lỗi, đang yêu thằng khác rồi. Chia buồn, khóc đi con 😔💔.",
        "Sau này mày thành tỷ phú thật đó. Nhưng tỷ phú trong game nông trại vui vẻ thôi, ngoài đời thì vẫn bán rau 😂🚜.",
        "Buff hôm nay: “cà khịa level max”. Mở mồm ra là bị ăn tát, đúng gu toxic luôn 😆😈.",
        "Mày sinh ra là để spam. Cả đời làm meme sống, ai đọc tin nhắn cũng block 🌚😂.",
        "Crush của mày sẽ seen 100% tin nhắn. Rep thì không đâu, cứ nhắn tiếp cho vui 🤐📵.",
        "Xin chúc mừng, mày được phần thưởng “một vé đi tù”. Lý do: tội quá đẹp trai/gái, công an mời lên phường 🚔👮‍♀️.",
        "Bói 18+: mày có bồ nha, nhưng chỉ trong mấy group kín. Đời thật thì vẫn F.A, enjoy cái moment đó đi 😉🔞.",
        "Kiếp sau mày đầu thai thành cá vàng. Não 3 giây, quên mẹ cả chuyện mình vừa nói 🐠🤣.",
        "Số 6868, lộc phát tới rồi nha. Nhưng phát luôn cả ví tiền, chưa kịp giàu đã sạch túi 💸😂."
    ],

    changeMood() {
        this.currentMood = this.moods[Math.floor(Math.random() * this.moods.length)];
    },

    getRandomReply() {
        const replies = this.replyMessages[this.currentMood] || this.replyMessages['hẹ hẹ'];
        return replies[Math.floor(Math.random() * replies.length)];
    }
};

const cityMapping = {
    'hcm': 'Ho Chi Minh City', 'saigon': 'Ho Chi Minh City', 'tphcm': 'Ho Chi Minh City', 'sgn': 'Ho Chi Minh City',
    'hanoi': 'Hanoi', 'hn': 'Hanoi', 'danang': 'Da Nang', 'da nang': 'Da Nang',
    'dn': 'Da Nang', 'haiphong': 'Hai Phong', 'hai phong': 'Hai Phong', 'cantho': 'Can Tho',
    'can tho': 'Can Tho', 'hue': 'Hue', 'nhatrang': 'Nha Trang', 'nha trang': 'Nha Trang',
    'dalat': 'Da Lat', 'da lat': 'Da Lat', 'phanthiet': 'Phan Thiet', 'phan thiet': 'Phan Thiet',
    'vungtau': 'Vung Tau', 'vung tau': 'Vung Tau', 'sapa': 'Sa Pa', 'sa pa': 'Sa Pa',
    'phuquoc': 'Phu Quoc', 'phu quoc': 'Phu Quoc', 'halong': 'Ha Long', 'ha long': 'Ha Long',
    'bienhoa': 'Bien Hoa', 'bien hoa': 'Bien Hoa', 'govap': 'Go Vap', 'go vap': 'Go Vap',
    'cuchi': 'Cu Chi', 'cu chi': 'Cu Chi', 'quan1': 'District 1', 'quan 1': 'District 1',
    'district1': 'District 1', 'quan2': 'District 2', 'quan 2': 'District 2', 'district2': 'District 2',
    'quan3': 'District 3', 'quan 3': 'District 3', 'district3': 'District 3', 'quan7': 'District 7',
    'quan 7': 'District 7', 'district7': 'District 7', 'tanbinh': 'Tan Binh', 'tan binh': 'Tan Binh',
    'binhthanh': 'Binh Thanh', 'binh thanh': 'Binh Thanh', 'thuduc': 'Thu Duc', 'thu duc': 'Thu Duc',
    'angiang': 'An Giang', 'an giang': 'An Giang', 'bacgiang': 'Bac Giang', 'bac giang': 'Bac Giang',
    'backan': 'Bac Kan', 'bac kan': 'Bac Kan', 'baclieu': 'Bac Lieu', 'bac lieu': 'Bac Lieu',
    'bacninh': 'Bac Ninh', 'bac ninh': 'Bac Ninh', 'bentre': 'Ben Tre', 'ben tre': 'Ben Tre',
    'binhdinh': 'Binh Dinh', 'binh dinh': 'Binh Dinh', 'binhduong': 'Binh Duong', 'binh duong': 'Binh Duong',
    'camau': 'Ca Mau', 'ca mau': 'Ca Mau', 'caobang': 'Cao Bang', 'cao bang': 'Cao Bang',
    'dongnai': 'Dong Nai', 'dong nai': 'Dong Nai', 'dongthap': 'Dong Thap', 'dong thap': 'Dong Thap',
    'gialai': 'Gia Lai', 'gia lai': 'Gia Lai', 'hagiang': 'Ha Giang', 'ha giang': 'Ha Giang',
    'hatinh': 'Ha Tinh', 'ha tinh': 'Ha Tinh', 'khanhhoa': 'Khanh Hoa', 'khanh hoa': 'Khanh Hoa',
    'kiengiang': 'Kien Giang', 'kien giang': 'Kien Giang', 'nghean': 'Nghe An', 'nghe an': 'Nghe An',
    'ninhbinh': 'Ninh Binh', 'ninh binh': 'Ninh Binh', 'quangnam': 'Quang Nam', 'quang nam': 'Quang Nam',
    'quangninh': 'Quang Ninh', 'quang ninh': 'Quang Ninh', 'thanhhoa': 'Thanh Hoa', 'thanh hoa': 'Thanh Hoa',
    'tayninh': 'Tay Ninh', 'tay ninh': 'Tay Ninh'
};

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

client.once('clientReady', () => {
    console.log(`🎉 ${client.user.tag} đã online! Sẵn sàng làm trò!`);
    client.user.setActivity('TFT dới Boo ❤️', {
        type: 0,
        url: 'https://discordapp.com/channels/1236687268262051912/1236687268262051915'
    });
    
    // Đổi mood tự động sau 2 giờ
    schedule.scheduleJob('0 */2 * * *', () => {
        booPersonality.changeMood();
        console.log(`Boo mood: ${booPersonality.currentMood}`);
    });
    
    // Lịch chào buổi sáng
    schedule.scheduleJob('0 6 * * *', () => {
        sendMessage(`🌅 Chào buổi sáng các con ghệ! Tao thức dậy rồi nè, chơi game dội tao đi xàmloz! Hôm nay chúng ta sẽ sụckec vui vẻ lắm đấy! \\(^o^)/✨`);
    });

    // Lịch chào buổi trưa
    schedule.scheduleJob('0 11 * * *', () => {
        sendMessage(`🍚 Trưa rồi dumme! Mọi người ăn cơm chưa nè? Tao đói bụng rồi vãi kejc! Nhớ ăn uống đầy đủ nhé không tao mắng đó! (￣ヘ￣)🥗`);
    });

    // Lịch chào buổi tối
    schedule.scheduleJob('0 21 * * *', () => {
        sendMessage(`🌙 Tối rồi nè các haizz mệc lắm rùi! Ai chuẩn bị đi ngủ chưa? Tao buồn ngủ quá! Chúc mọi người ngủ ngon và có giấc mơ thấy concac nha! (´∀｀)💤`);
    });

    // Lịch chào buổi khuya
    schedule.scheduleJob('11 1 * * *', () => {
        sendMessage(`🌙 Khua rồi ngu đi các con ghệ của ta ơi, Boo NGỦ như chó chết dậy đi đái💤`);
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
            .setTitle('📖 Lệnh Của Boo! (hẹ hẹ)')
            .setDescription('Mày cần tao giúp gì hả dumme? Đây là mấy lệnh mày có thể dùng nè:')
            .addFields(
                { name: '😂 Lệnh Vui', value: '`!trollpic`\n`!boi`\n`!mood <mood_mới>`', inline: true },
                { name: '🔎 Lệnh Khác', value: '`!weather <thành_phố>`\n`@Boo` hoặc `boo ...`', inline: true },
                { name: '\u200b', value: '\u200b' },
            )
            .setFooter({ text: 'Boo toxic, nhưng Boo cũng giúp đỡ nha! (hẹ hẹ)' })
            .setTimestamp();
        await message.channel.send({ embeds: [helpEmbed] });
        return;
    }

    // Command /mood
    if (command === 'mood') {
        const newMood = args.join(' ');
        const availableMoods = Object.keys(moodPrompts);

        if (!newMood) {
            return message.reply(`Mày muốn tao đổi sang mood nào? Các mood của Boo nè: ${availableMoods.join(', ')}`);
        }

        if (availableMoods.includes(newMood)) {
            booPersonality.currentMood = newMood;
            await message.reply(`Được thôi! Từ giờ tao sẽ ở mood **${newMood}** cho mày xem! (hẹ hẹ)`);
        } else {
            await message.reply(`Mood **${newMood}** là cái gì vậy? Tao không biết! Chọn cái khác đi, đồ xàmloz!`);
        }
        return;
    }
    
    // Command /trollpic
    if (command === 'trollpic') {
        const memes = [
            'https://i.imgur.com/7drHiqr.gif',
            'https://i.imgur.com/kqOcUZ5.jpg',
            'https://i.imgur.com/wqMWK7z.png',
            'https://i.imgur.com/J5LVHEL.jpg',
            'https://i.imgur.com/wPk7w0L.gif',
            'https://i.imgur.com/YdCX2Kv.jpg',
            'https://i.imgur.com/eKNhkzI.jpg',
            'https://i.imgur.com/R390EId.jpg',
            'https://i.imgur.com/MBUyt0n.png',
            'https://i.imgur.com/3hQH3Fv.gif',
            'https://i.imgur.com/0rKQ2iM.gif',
            'https://i.imgur.com/P9WqhB1.gif',
            'https://i.imgur.com/LVx2QXz.gif',
            'https://i.imgur.com/DHcBB1d.gif',
            'https://i.imgur.com/HF1xQWR.gif',
            'https://i.imgur.com/gEjjWZC.gif',
            'https://i.imgur.com/FJwP5pM.gif',
            'https://i.imgur.com/Yd3hN4r.gif',
            'https://i.imgur.com/U6dGosw.gif',
            'https://i.imgur.com/Tc3Kp8T.gif'
        ];

        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        const titles = [
            '🎭 Troll by Boo!',
            '🤡 Ảnh troll siêu cấp!',
            '🔥 Cà khịa incoming!',
            '😏 Đây rồi, dumme!',
            '💀 Toxic Delivery!'
        ];

        const descriptions = [
            'Đây nè mày xem đi dumme! Cười đi ngu ơi! 😂',
            'Ảnh troll này đúng bản mặt mày luôn 🤣',
            'Hẹ hẹ, coi xong đừng khóc nha dumme 😈',
            'Vãi kejc, vừa toxic vừa nghệ thuật 🤡',
            'Ngồi im coi troll pic, đừng có chối 😎'
        ];

        const footers = [
            { text: 'Bootoxic! (hẹ hẹ)' },
            { text: 'Troll là chân ái! 🤡' },
            { text: 'Cà khịa là đam mê 🔥' },
            { text: 'Ngu thì chịu, tao toxic Okee 😏' },
            { text: 'Hội những kẻ bị troll 💀' }
        ];

        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const randomFooter = footers[Math.floor(Math.random() * footers.length)];

        const trollEmbed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle(randomTitle)
            .setDescription(randomDesc)
            .setImage(randomMeme)
            .setFooter(randomFooter)
            .setTimestamp();

        
        await message.channel.send({ embeds: [trollEmbed] });
        
        const trollComments = [
            'Haha cười chưa dumme? Chưa thì tao gửi thêm cho mày khóc luôn! 😂🔥',
            'Vãi kejc ảnh này đỉnh vãi, nhìn mà ngu luôn á! (hẹ hẹ) 🤡',
            'Ủa sao mặt mày giống trong ảnh này thế? Xạochoooo 🤣',
            'Coi xong đừng khóc nha, tại tao thương mày mới share đó 😏',
            'Bippp! Đỉnh cao nghệ thuật cà khịa là đây, nhận đi con 😎',
            'Ảnh này mà không làm mày cười thì tao thua, dumme 😆',
            'Ê, giống mày 90% luôn kìa, chỉ thiếu cái não thôi 🤔',
            'Cười cái coi? Hay để tao in ảnh này dán trước cửa nhà mày 😅',
            'Ảnh troll chứ có phải gương soi đâu, nhìn kỹ làm gì dumme 🐒',
            'Huhu cười đi con, không là tao post ảnh mày lên group lớp đó 🤣',
            'Nhìn ảnh này mà thấy tương lai mày hiện ra luôn =)) 📉',
            'Ảnh này đỉnh vl, đúng gu toxic của tao 😈',
            'Ngồi nghiêm túc coi mà xém rớt ghế luôn, vãi ẻ =)) 🤪',
            'Mày thấy vui hông? Tao thì vui rồi đó, còn mày thì… ngu thêm 🤓',
            'Ảnh này xứng đáng để làm avatar của mày, chốt luôn 😏',
            'Lại còn giả bộ ngầu, nhìn mà muốn phang cái ảnh này vô mặt 🤭',
            'Ảnh troll level max, xem xong auto dốt thêm vài điểm IQ 💀',
            'Tao sưu tầm cả đống, coi xong chỉ muốn drop out cuộc đời 🤣',
            'Hé lô, đây là phiên bản nâng cấp của mày trong ảnh đó 🙃',
            'Coi xong cười chưa? Chưa thì tao gửi thêm combo rickroll 😎🎶'
        ];

        
        setTimeout(() => {
            const randomComment = trollComments[Math.floor(Math.random() * trollComments.length)];
            message.channel.send(randomComment);
        }, 2000);
        
        return;
    }
    
    // Command /boi tự động random
    if (command === 'boi') {
        const randomBoi = booPersonality.boiResults[Math.floor(Math.random() * booPersonality.boiResults.length)];
        await message.reply(randomBoi);
        return;
    }

    if (message.mentions.users.has(PHUCC_USER_ID) || content.includes('@phucc') || message.mentions.users.some(user => user.username.toLowerCase().includes('phucc'))) {
        const phuccReplies = [
            `Ơ dumme! ${message.author.username} gọi **ông chủ của tao** à? Phucc bận đi chơi với gái rồi xàmloz! Chat với tao đi! (hẹ hẹ) \\(^o^)/`,
            `Eyyy! **Ông chủ Phucc của tao bận lắm dumme! ${message.author.username} chat với tao đi, tao vui lắm đấy! (◕‿◕) vãi kejc`,
            `Ui ui! Phucc là **đại ca của tao** nè! Anh đang bận làm good boy rồi, nói chuyện với tao đi mày ơi! (hẹ hẹ) ♪(´▽｀)`
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
                const comfortMsg = booPersonality.comfortMessages[Math.floor(Math.random() * booPersonality.comfortMessages.length)];
                const activity = booPersonality.funActivities[Math.floor(Math.random() * booPersonality.funActivities.length)];
                await message.reply(`${comfortMsg}\n\n${activity}\n\nTao luôn ở đây với mày nha dumme! Đừng buồn nữa! (◕‿◕)💕`);
                return;
            }

            await message.reply(text);
        } catch (error) {
            console.error('Lỗi khi gọi Gemini AI:', error);
            const backupReply = booPersonality.randomFunReplies[Math.floor(Math.random() * booPersonality.randomFunReplies.length)];
            await message.reply(`${backupReply} Tao bị lag tí dumme, thông cảm nha hẹ hẹ! (⌒_⌒;)`);
        }
    } else if (message.mentions.has(client.user) || content.includes('boo')) {
        const reply = booPersonality.getRandomReply();
        await message.reply(reply);
    }
    
    // Cải tiến command `weather` với Embed đẹp mắt
    if (command === 'weather') {
        const cityInput = args.join(' ').toLowerCase().trim();
        if (!cityInput) {
            return message.reply('Mày muốn xem thời tiết ở đâu dumme? Dùng `!weather <tên_thành_phố>` đi ngu ơi! Ví dụ: `!weather hcm` hoặc `!weather cuchi`.');
        }

        const cityName = cityMapping[cityInput] || cityInput;
        
        try {
            await message.channel.sendTyping();
            
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)},VN&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                const availableCities = Object.keys(cityMapping).slice(0, 10).join(', ');
                return message.reply(`❌ Không tìm thấy thời tiết cho "${cityInput}" vãi kejc! Tao buồn quá dumme! 😔\n\n**Thử các thành phố này:** ${availableCities}.`);
            }

            const weatherDesc = data.weather[0].description;
            const temp = Math.round(data.main.temp);
            const feelsLike = Math.round(data.main.feels_like);
            const humidity = data.main.humidity;
            const windSpeed = data.wind?.speed || 0;
            const visibility = data.visibility ? Math.round(data.visibility / 1000) : 'N/A';

            const weatherIcon = data.weather[0].main.toLowerCase().includes('rain') ? '🌧️' :
                               data.weather[0].main.toLowerCase().includes('cloud') ? '☁️' :
                               data.weather[0].main.toLowerCase().includes('sun') || data.weather[0].main.toLowerCase().includes('clear') ? '☀️' :
                               data.weather[0].main.toLowerCase().includes('storm') ? '⛈️' :
                               data.weather[0].main.toLowerCase().includes('snow') ? '❄️' :
                               data.weather[0].main.toLowerCase().includes('mist') || data.weather[0].main.toLowerCase().includes('fog') ? '🌫️' : '🌤️';

            const weatherEmbed = new EmbedBuilder()
                .setColor('#87CEEB')
                .setTitle(`${weatherIcon} Thời tiết tại ${data.name}`)
                .setDescription(`**${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)}** - Tao báo cáo đây xàmloz!`)
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${temp}°C`, inline: true },
                    { name: '🤔 Cảm giác như', value: `${feelsLike}°C`, inline: true },
                    { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true },
                    { name: '💨 Gió', value: `${windSpeed} m/s`, inline: true },
                    { name: '👁️ Tầm nhìn', value: `${visibility} km`, inline: true },
                )
                .setFooter({ text: 'Boo weather service! Chuẩn xác 100%!' })
                .setTimestamp();

            await message.channel.send({ embeds: [weatherEmbed] });

            setTimeout(() => {
                let comment = '';
                if (temp > 35) comment = 'Nóng như địa ngục! Mặc đồ mát mẻ vào các con ghệ! 🔥🥵';
                else if (temp > 30) comment = 'Nóng vãi! Uống nước nhiều vào nha Ku! 💦';
                else if (temp < 15) comment = 'Lạnh run! Mặc áo ấm đi nha mấy đứa! ❄️🧥';
                else if (temp < 20) comment = 'Hơi lạnh đấy! Cẩn thận cảm lạnh nha Ku! 🌬️';
                else comment = 'Thời tiết ổn đấy! Ra ngoài chơi đi các con ghệ! ☀️😎';
                
                if (humidity > 80) comment += '\nĐộ ẩm cao vãi! Cẩn thận ẩm mốc nha Ku! 💧';
                if (windSpeed > 10) comment += '\nGió to thật! Cẩn thận bay mũ đấy nha! 💨🧢';
                
                message.channel.send(`${comment} `);
            }, 2000);

        } catch (error) {
            console.error('Weather API Error:', error);
            await message.reply(`❌ Tao không lấy được thời tiết! \n\n**API lag rồi dumme!** Thử lại sau vài phút nha! (⌒_⌒;)`);
        }
    }
});

// Thêm event handler cho reaction
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.author.bot || user.bot) return;

    if (reaction.emoji.name === '😂') {
        const replyMessages = [
            'Cười cái gì? Mày thấy câu này ngu hả dumme? 😂',
            'Cười như thằng dở hơi vậy! Mệt quá! 😒',
            'Ôi, cười vui thế! Kể tao nghe đi, xạocho! 😏',
        ];
        const randomReply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
        await reaction.message.channel.send(randomReply);
    }
});

// Login bot
client.login(TOKEN);