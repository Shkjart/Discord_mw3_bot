const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials,
  ChannelType,
  PermissionsBitField
} = require("discord.js");
require("dotenv").config();

const config = {
  threadLifetime: 10 // بالدقايق
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

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // أي شي يكتبه العضو
  const embed = new EmbedBuilder()
    .setTitle("🎮 تحدي جديد")
    .setDescription(`اللاعب ${message.author} يطلب تحدي!\nاضغط الزر المناسب للانضمام.`)
    .setColor("Purple");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("✅ قبول")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("decline")
      .setLabel("❌ رفض")
      .setStyle(ButtonStyle.Danger)
  );

  await message.reply({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const message = await interaction.message.fetch();
  const challenger = message.mentions.users.first() || message.interaction?.user;

  if (interaction.customId === "accept") {
    // إنشاء ثريد خاص
    const thread = await message.channel.threads.create({
      name: `تحدي-${challenger.username}-${interaction.user.username}`,
      type: ChannelType.PrivateThread,
      autoArchiveDuration: 60,
      reason: "تحدي جديد",
      invitable: false
    });

    // إضافة المتحدي واللي وافق
    await thread.members.add(challenger.id);
    await thread.members.add(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("⚔️ بدأ التحدي!")
      .setDescription(`تم فتح هذا الثريد الخاص بين:\n- ${challenger}\n- ${interaction.user}\n\n⏳ سينتهي التحدي تلقائياً بعد ${config.threadLifetime} دقائق.`)
      .setThumbnail("https://cdn.discordapp.com/attachments/1420104101483778140/1420757983159124118/2a033a234428549c4dc0de29bd252cc2.gif")
      .setColor("DarkPurple");

    await thread.send({ content: `${challenger} vs ${interaction.user}`, embeds: [embed] });

    // يقفل بعد الوقت المحدد
    setTimeout(async () => {
      await thread.setArchived(true, "انتهى الوقت المحدد للتحدي");
    }, config.threadLifetime * 60 * 1000);

    await interaction.reply({ content: "✅ تم قبول التحدي! تم إنشاء ثريد خاص.", ephemeral: true });
  }

  if (interaction.customId === "decline") {
    await interaction.reply({ content: "❌ تم رفض التحدي.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
