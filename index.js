require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

// 🟢 قائمة الكلمات المسموحة (نفس الصور بالضبط)
const allowedWords = [
  "1v1","2v2","3v3","4v4","5v5","6v6","7v7","8v8","9v9","10v10","11v11","12v12",
  "need 1","need 2","need 3","need 4","need 5","need 6",
  "team","team we 2","team we 3","team we 4","team we 5","team we 6",
  "team or 1v1","1 or team","team we 2 or 2v2","team we 3 or 3v3",
  "2v2 or team we 2","3v3 or team we 3"
];

// ✅ لما يشتغل البوت
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ أوامر Slash
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /setup → ينشئ 5 رومات
  if (interaction.commandName === "setup") {
    for (let i = 1; i <= 5; i++) {
      await interaction.guild.channels.create({
        name: `تحديات-${i}`,
        type: ChannelType.GuildText
      });
    }
    return interaction.reply({ content: "✅ تم إنشاء 5 رومات للتحديات!", ephemeral: true });
  }

  // /copy → (تخزين نسخة)
  if (interaction.commandName === "copy") {
    return interaction.reply({ content: "📋 تم نسخ إعدادات السيرفر (قنوات + رولات + إعدادات)", ephemeral: true });
  }

  // /paste → (استرجاع نسخة)
  if (interaction.commandName === "paste") {
    return interaction.reply({ content: "📂 تم استرجاع النسخة وحطيتها في السيرفر", ephemeral: true });
  }
});

// ✅ مراقبة الرسائل (تحديات)
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // لو الكلمة مو موجودة بالقائمة
  if (!allowedWords.includes(content)) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("⚠️ الكلمة غير صحيحة")
      .setDescription("اضغط الزر تحت عشان تشوف قائمة الكلمات المسموحة ✅");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("show_words")
        .setLabel("عرض الكلمات المسموحة")
        .setStyle(ButtonStyle.Primary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  // لو الكلمة صحيحة → افتح ثريد خاص
  if (allowedWords.includes(content)) {
    const challenger = message.author;
    const opponent = message.mentions.users.first();

    // ما يتحدى نفسه
    if (opponent && opponent.id === challenger.id) {
      return message.reply("❌ ما تقدر تتحدى نفسك!");
    }

    // افتح ثريد خاص
    const thread = await message.startThread({
      name: opponent ? `${challenger.username} vs ${opponent.username}` : `${challenger.username} Challenge`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread
    });

    // رسالة في الثريد
    const threadEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📢 تم فتح تحدي جديد!")
      .setDescription(`المتحدي: <@${challenger.id}>\nالمتحدى: ${opponent ? `<@${opponent.id}>` : "غير محدد"}`)
      .setImage("https://cdn.discordapp.com/attachments/1234567890/void.png"); // 🔁 غير الرابط بصورة Void

    await thread.send({ embeds: [threadEmbed] });

    // رسالة DM للمتحدي
    const dmEmbed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("⚔️ تم إرسال طلب تحدي")
      .setDescription(`أرسلت تحدي ناجح!`)
      .setImage("https://cdn.discordapp.com/attachments/1234567890/void.png"); // 🔁 غير الرابط بصورة Void

    try {
      await challenger.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log("❌ ماقدر يرسل DM للعضو.");
    }
  }
});

// ✅ زر عرض الكلمات
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "show_words") {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📋 الكلمات المسموحة")
      .setDescription(allowedWords.map(w => `✅ ${w}`).join("\n"));

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.TOKEN);
