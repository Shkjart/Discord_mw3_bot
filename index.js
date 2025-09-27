const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials,
  ChannelType
} = require("discord.js");
require("dotenv").config();

const config = {
  threadLifetime: 10 // مدة التحدي بالدقائق
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// أي رسالة = إعلان تحدي
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const challengeEmbed = new EmbedBuilder()
    .setTitle("🎮 تحدي جديد!")
    .setDescription(
      `🔥 اللاعب **${message.author.username}** أعلن عن تحدي!  

✨ الخيارات أمامك:  
- ✅ **اضغط قبول** إذا جاهز للمواجهة.  
- ❌ **اضغط رفض** إذا ما تبغى تدخل الجولة.  

⚔️ إذا صار في قبول → يتفتح **ثريد خاص** بينك وبين الخصم.  
⏳ المدة: **${config.threadLifetime} دقيقة فقط** وبعدها يتقفل التحدي تلقائياً.`
    )
    .setColor("Purple")
    .setFooter({ text: "🚀 خذ قرارك بسرعة، كل ثانية تفرق!" })
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1420104101483778140/1420757983159124118/2a033a234428549c4dc0de29bd252cc2.gif"
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("✅ قبول التحدي")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("decline")
      .setLabel("❌ رفض")
      .setStyle(ButtonStyle.Danger)
  );

  const sentMsg = await message.reply({
    embeds: [challengeEmbed],
    components: [row]
  });

  const collector = sentMsg.createMessageComponentCollector({
    time: config.threadLifetime * 60 * 1000
  });

  collector.on("collect", async (i) => {
    if (i.customId === "accept") {
      startChallenge(message.author, i.user, message.channel, i);
    } else if (i.customId === "decline") {
      const declineEmbed = new EmbedBuilder()
        .setTitle("❌ التحدي مرفوض")
        .setDescription(
          `🚫 اللاعب **${i.user.username}** رفض التحدي.  

💡 لا تقلق ${message.author.username}،  
الفرصة دايم موجودة لتحديات جديدة 🔥.`
        )
        .setColor("Red")
        .setFooter({ text: "🔔 جرب حظك مع خصم آخر!" });

      try {
        await message.author.send({ embeds: [declineEmbed] });
      } catch (err) {
        console.log("❌ ما قدر يرسل DM للعضو.");
      }

      await i.reply({ content: "❌ تم رفض التحدي.", ephemeral: true });
    }
  });
});

// بدء التحدي داخل ثريد
async function startChallenge(challenger, opponent, channel, interaction) {
  const thread = await channel.threads.create({
    name: `${challenger.username} ⚔️ ${opponent.username}`,
    autoArchiveDuration: 60,
    type: ChannelType.PrivateThread,
    reason: "تحدي جديد"
  });

  await thread.members.add(challenger.id);
  await thread.members.add(opponent.id);

  const threadEmbed = new EmbedBuilder()
    .setTitle("⚔️ ساحة التحدي")
    .setDescription(
      `🔥 المواجهة بدأت الآن!  

👤 المتحدي: ${challenger}  
👤 الخصم: ${opponent}  

⏳ عندكم **${config.threadLifetime} دقيقة** لإثبات نفسكم!  
🚨 بعد الوقت هذا، الثريد بيتقفل تلقائياً.`
    )
    .setColor("DarkPurple")
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1420104101483778140/1420757983159124118/2a033a234428549c4dc0de29bd252cc2.gif"
    )
    .setFooter({ text: "🏆 التحدي للأقوى فقط!" });

  await thread.send({
    content: `${challenger} ⚔️ ${opponent}`,
    embeds: [threadEmbed]
  });

  // تذكير قبل دقيقة
  setTimeout(async () => {
    if (!thread.archived) {
      await thread.send("⏳ **تذكير:** باقي دقيقة واحدة قبل نهاية التحدي!");
    }
  }, (config.threadLifetime - 1) * 60 * 1000);

  // بعد الوقت: قفل التحدي + DM برسالة نهاية
  setTimeout(async () => {
    if (!thread.archived) {
      await thread.setArchived(true, "انتهى وقت التحدي");
    }

    const endEmbed = new EmbedBuilder()
      .setTitle("⌛ انتهى وقت التحدي")
      .setDescription(
        `⚔️ الجولة بين **${challenger.username}** و **${opponent.username}** انتهت!  

🔄 إذا تبغون تعيدون الجولة، تقدرون تضغطون على الزر تحت لبدء تحدي جديد مباشرة.`
      )
      .setColor("Red")
      .setFooter({ text: "🎮 استعدوا للجولة القادمة!" });

    const rematchRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rematch")
        .setLabel("🔄 إعادة التحدي")
        .setStyle(ButtonStyle.Primary)
    );

    try {
      await challenger.send({ embeds: [endEmbed], components: [rematchRow] });
    } catch (err) {
      console.log("❌ ما قدر يرسل DM للمتحدي.");
    }

    try {
      await opponent.send({ embeds: [endEmbed], components: [rematchRow] });
    } catch (err) {
      console.log("❌ ما قدر يرسل DM للخصم.");
    }
  }, config.threadLifetime * 60 * 1000);

  await interaction.reply({
    content: "✅ تم قبول التحدي! الجولة بدأت 🔥",
    ephemeral: true
  });
}

// التعامل مع زر إعادة التحدي
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "rematch") {
    const challenger = interaction.user;
    // نحاول نجيب الخصم من آخر رسالة DM
    const opponent = interaction.message.embeds[0]?.description?.match(/\*\*(.*?)\*\*/g);
    if (!opponent || opponent.length < 2) {
      return interaction.reply({ content: "❌ ما قدرت ألقى الخصم لإعادة التحدي.", ephemeral: true });
    }

    const opponentName = opponent[0].replace(/\*/g, "");
    const guild = client.guilds.cache.first(); // أول سيرفر (تقدر تحدد سيرفر معين)
    const channel = guild.channels.cache.find(ch => ch.isTextBased());

    if (!channel) {
      return interaction.reply({ content: "❌ ما لقيت روم أفتح فيه التحدي.", ephemeral: true });
    }

    // نفتح تحدي جديد
    await startChallenge(challenger, channel.guild.members.cache.find(m => m.user.username === opponentName)?.user, channel, interaction);
  }
});

client.login(process.env.TOKEN);
