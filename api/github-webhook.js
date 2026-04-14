const axios = require('axios');

// Discord webhook URLs - support multiple webhooks
const getDiscordWebhooks = () => {
  const webhooks = {
    all: [], // Kirim ke semua
    general: process.env.DISCORD_WEBHOOK_GENERAL,
    releases: process.env.DISCORD_WEBHOOK_RELEASES,
    issues: process.env.DISCORD_WEBHOOK_ISSUES,
    pullRequests: process.env.DISCORD_WEBHOOK_PULL_REQUESTS
  };

  // Support multiple webhooks separated by comma
  if (process.env.DISCORD_WEBHOOK_URLS) {
    webhooks.all = process.env.DISCORD_WEBHOOK_URLS.split(',').map(url => url.trim());
  }

  return webhooks;
};

// Fungsi untuk kirim ke multiple Discord webhooks
const sendToDiscord = async (webhookUrls, data) => {
  const urls = Array.isArray(webhookUrls) ? webhookUrls : [webhookUrls];
  const results = [];

  for (const url of urls) {
    if (!url) continue;
    
    try {
      await axios.post(url, data);
      console.log(`✅ Sent to Discord: ${url.substring(0, 50)}...`);
      results.push({ url, success: true });
    } catch (error) {
      console.error(`❌ Failed to send to Discord: ${url.substring(0, 50)}...`, error.message);
      results.push({ url, success: false, error: error.message });
    }
  }

  return results;
};

module.exports = async (req, res) => {
  // Hanya terima POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;
    const webhooks = getDiscordWebhooks();

    // ===== Filter Data - Buang Username =====
    let message = '';
    let embedData = null;
    let targetWebhooks = []; // Webhook mana yang akan dikirimi

    switch (event) {
      case 'push':
        const branch = payload.ref.replace('refs/heads/', '');
        const repo = payload.repository.name;
        const commits = payload.commits || [];

        message = `🔄 **Push to ${repo}** (\`${branch}\`)\n`;
        
        commits.forEach(commit => {
          const shortId = commit.id.substring(0, 7);
          const time = new Date(commit.timestamp).toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta'
          });
          
          message += `\n📝 \`${shortId}\` ${commit.message}`;
          message += `\n⏰ ${time}`;
          message += `\n📊 Files: +${commit.added.length} -${commit.removed.length} ~${commit.modified.length}\n`;
        });

        // Discord embed format (lebih rapi)
        embedData = {
          embeds: [{
            title: `🔄 Push to ${repo}`,
            description: `Branch: \`${branch}\``,
            color: 0x5865F2,
            fields: commits.map(commit => ({
              name: `\`${commit.id.substring(0, 7)}\` ${commit.message}`,
              value: `⏰ ${new Date(commit.timestamp).toLocaleString('id-ID')}\n📊 +${commit.added.length} -${commit.removed.length} ~${commit.modified.length}`,
              inline: false
            })),
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Bot',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook general atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'pull_request':
        const action = payload.action;
        const pr = payload.pull_request;

        message = `🔀 **Pull Request ${action}**\n`;
        message += `\n#${pr.number}: ${pr.title}`;
        message += `\n\`${pr.head.ref}\` → \`${pr.base.ref}\``;
        message += `\nState: ${pr.state}`;

        embedData = {
          embeds: [{
            title: `🔀 Pull Request ${action}`,
            description: `#${pr.number}: ${pr.title}`,
            color: action === 'opened' ? 0x57F287 : action === 'closed' ? 0xED4245 : 0xFEE75C,
            fields: [
              {
                name: 'Branch',
                value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``,
                inline: true
              },
              {
                name: 'State',
                value: pr.state,
                inline: true
              }
            ],
            url: pr.html_url,
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Bot',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook pull requests atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.pullRequests) targetWebhooks.push(webhooks.pullRequests);
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'release':
        const release = payload.release;

        message = `🚀 **Release ${payload.action}**\n`;
        message += `\n${release.tag_name}: ${release.name || 'No name'}`;
        message += `\n\n${release.body || 'No description'}`;

        embedData = {
          embeds: [{
            title: `🚀 Release ${payload.action}`,
            description: `**${release.tag_name}**: ${release.name || 'No name'}`,
            color: 0x57F287,
            fields: [
              {
                name: 'Release Notes',
                value: (release.body || 'No description').substring(0, 1024), // Discord limit
                inline: false
              }
            ],
            url: release.html_url,
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Bot',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook releases atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.releases) targetWebhooks.push(webhooks.releases);
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'issues':
        const issue = payload.issue;

        message = `🐛 **Issue ${payload.action}**\n`;
        message += `\n#${issue.number}: ${issue.title}`;
        message += `\nState: ${issue.state}`;

        embedData = {
          embeds: [{
            title: `🐛 Issue ${payload.action}`,
            description: `#${issue.number}: ${issue.title}`,
            color: payload.action === 'opened' ? 0x57F287 : 0xED4245,
            fields: [
              {
                name: 'State',
                value: issue.state,
                inline: true
              }
            ],
            url: issue.html_url,
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Bot',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook issues atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.issues) targetWebhooks.push(webhooks.issues);
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      default:
        message = `ℹ️ **${event}** event received`;
        embedData = {
          embeds: [{
            title: `ℹ️ ${event} event`,
            description: `Action: ${payload.action || 'N/A'}`,
            color: 0x5865F2,
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Bot',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook general atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.general) targetWebhooks.push(webhooks.general);
    }

    // ===== Log ke Vercel Console =====
    console.log('=== GitHub Update ===');
    console.log(`Event: ${event}`);
    console.log(message);
    console.log('===================');

    // ===== Kirim ke Multiple Discord Webhooks =====
    let discordResults = [];
    if (targetWebhooks.length > 0) {
      console.log(`📤 Sending to ${targetWebhooks.length} Discord webhook(s)...`);
      discordResults = await sendToDiscord(targetWebhooks, embedData);
    } else {
      console.log('⚠️ No Discord webhooks configured');
    }

    // ===== Response ke GitHub =====
    return res.status(200).json({
      success: true,
      event: event,
      message: 'Webhook received and processed',
      discord: {
        sent: discordResults.filter(r => r.success).length,
        failed: discordResults.filter(r => !r.success).length,
        total: discordResults.length
      }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
