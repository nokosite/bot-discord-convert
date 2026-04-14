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
        const repoUrl = payload.repository.html_url;
        const commits = payload.commits || [];
        const totalCommits = commits.length;

        // Discord embed format (lebih rapi dan menarik)
        const commitFields = commits.slice(0, 5).map(commit => {
          const added = commit.added?.length || 0;
          const removed = commit.removed?.length || 0;
          const modified = commit.modified?.length || 0;
          const shortId = commit.id.substring(0, 7);
          const commitUrl = commit.url || `${repoUrl}/commit/${commit.id}`;
          
          let statsText = '';
          if (added > 0) statsText += `**+${added}** `;
          if (removed > 0) statsText += `**-${removed}** `;
          if (modified > 0) statsText += `**~${modified}** `;
          if (!statsText) statsText = 'No changes';
          
          return {
            name: `[\`${shortId}\`](${commitUrl}) ${commit.message.substring(0, 60)}${commit.message.length > 60 ? '...' : ''}`,
            value: `📊 ${statsText}`,
            inline: false
          };
        });

        // Tambah info jika ada lebih banyak commits
        if (totalCommits > 5) {
          commitFields.push({
            name: '➕ More commits',
            value: `... and ${totalCommits - 5} more commit(s)`,
            inline: false
          });
        }

        embedData = {
          embeds: [{
            author: {
              name: `${repo}`,
              url: repoUrl,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            title: `📤 ${totalCommits} new commit${totalCommits > 1 ? 's' : ''} pushed`,
            description: `**Branch:** [\`${branch}\`](${repoUrl}/tree/${branch})`,
            color: 0x6E5494, // Purple color for push
            fields: commitFields,
            footer: {
              text: `${repo} • ${branch}`,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Updates',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook general atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'pull_request':
        const action = payload.action;
        const pr = payload.pull_request;
        const prRepo = payload.repository.name;
        const prRepoUrl = payload.repository.html_url;

        // Warna berdasarkan action
        let prColor = 0x3FB950; // Green untuk opened
        let prEmoji = '🟢';
        if (action === 'closed' && pr.merged) {
          prColor = 0x8957E5; // Purple untuk merged
          prEmoji = '🟣';
        } else if (action === 'closed') {
          prColor = 0xF85149; // Red untuk closed
          prEmoji = '🔴';
        }

        embedData = {
          embeds: [{
            author: {
              name: `${prRepo}`,
              url: prRepoUrl,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            title: `${prEmoji} Pull Request ${action}`,
            description: `**[#${pr.number}](${pr.html_url})** ${pr.title}`,
            color: prColor,
            fields: [
              {
                name: '🔀 Branches',
                value: `[\`${pr.head.ref}\`](${prRepoUrl}/tree/${pr.head.ref}) → [\`${pr.base.ref}\`](${prRepoUrl}/tree/${pr.base.ref})`,
                inline: false
              },
              {
                name: '📊 Changes',
                value: `**+${pr.additions || 0}** additions, **-${pr.deletions || 0}** deletions`,
                inline: true
              },
              {
                name: '📝 Commits',
                value: `${pr.commits || 0} commit(s)`,
                inline: true
              }
            ],
            footer: {
              text: `${prRepo} • Pull Request #${pr.number}`,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Updates',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook pull requests atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.pullRequests) targetWebhooks.push(webhooks.pullRequests);
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'release':
        const release = payload.release;
        const releaseRepo = payload.repository.name;
        const releaseRepoUrl = payload.repository.html_url;
        const releaseBody = release.body || 'No release notes provided';

        embedData = {
          embeds: [{
            author: {
              name: `${releaseRepo}`,
              url: releaseRepoUrl,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            title: `🚀 New Release: ${release.tag_name}`,
            description: `**${release.name || release.tag_name}**\n\n${releaseBody.substring(0, 500)}${releaseBody.length > 500 ? '...' : ''}`,
            color: 0x3FB950, // Green for release
            fields: [
              {
                name: '🏷️ Tag',
                value: `[\`${release.tag_name}\`](${release.html_url})`,
                inline: true
              },
              {
                name: '📦 Type',
                value: release.prerelease ? 'Pre-release' : 'Release',
                inline: true
              }
            ],
            footer: {
              text: `${releaseRepo} • Release`,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            timestamp: new Date(release.published_at || release.created_at).toISOString()
          }],
          username: 'GitHub Updates',
          avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };

        // Kirim ke webhook releases atau all
        targetWebhooks = [...webhooks.all];
        if (webhooks.releases) targetWebhooks.push(webhooks.releases);
        if (webhooks.general) targetWebhooks.push(webhooks.general);
        break;

      case 'issues':
        const issue = payload.issue;
        const issueRepo = payload.repository.name;
        const issueRepoUrl = payload.repository.html_url;
        const issueAction = payload.action;

        // Warna dan emoji berdasarkan action
        let issueColor = 0x3FB950; // Green untuk opened
        let issueEmoji = '🟢';
        if (issueAction === 'closed') {
          issueColor = 0x8957E5; // Purple untuk closed
          issueEmoji = '🟣';
        } else if (issueAction === 'reopened') {
          issueColor = 0xF85149; // Red untuk reopened
          issueEmoji = '🔴';
        }

        const issueBody = issue.body || 'No description provided';

        embedData = {
          embeds: [{
            author: {
              name: `${issueRepo}`,
              url: issueRepoUrl,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            title: `${issueEmoji} Issue ${issueAction}`,
            description: `**[#${issue.number}](${issue.html_url})** ${issue.title}\n\n${issueBody.substring(0, 300)}${issueBody.length > 300 ? '...' : ''}`,
            color: issueColor,
            fields: [
              {
                name: '🏷️ Labels',
                value: issue.labels?.length > 0 
                  ? issue.labels.map(l => `\`${l.name}\``).join(', ')
                  : 'No labels',
                inline: true
              },
              {
                name: '📊 State',
                value: issue.state,
                inline: true
              }
            ],
            footer: {
              text: `${issueRepo} • Issue #${issue.number}`,
              icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            timestamp: new Date().toISOString()
          }],
          username: 'GitHub Updates',
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
