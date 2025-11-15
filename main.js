export default {
  async fetch(request, env, ctx) {
    // 处理 CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    
    // 如果请求的是 API 端点
    if (url.pathname === '/api/user-info') {
      try {
        // 所有要监测的用户ID
        const userIds = [
          '672328094',  // 嘉然今天吃什么
          '672353429',  // 贝拉kira
          '672342685',  // 乃琳Queen
          '1669777785', // 露早GOGO
          '1795147802'  // 柚恩不加糖
        ];
        
        // 获取当前日期（用于判断是否需要更新缓存）
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        // 并行获取所有用户信息
        const promises = userIds.map(async (userId) => {
          try {
            const response = await fetch(`https://workers.vrp.moe/bilibili/user-info/${userId}`);
            const data = await response.json();
            
            // 提取所需数据
            const name = data?.data?.card?.name || '';
            const fans = data?.data?.card?.fans || 0;
            const face = data?.data?.card?.face || '';
            
            // 从 KV 读取缓存的粉丝数和日期
            const cacheKey = `fans_${userId}`;
            const dateKey = `date_${userId}`;
            
            let fansDiff = 0;
            
            // 检查 KV 是否可用
            if (env.FANS_CACHE) {
              try {
                const cachedFansStr = await env.FANS_CACHE.get(cacheKey);
                const cachedDate = await env.FANS_CACHE.get(dateKey);
                
                if (cachedFansStr && cachedDate === today) {
                  // 如果今天已经缓存过，计算差值（与今天基准值的差值）
                  const cachedFans = parseInt(cachedFansStr, 10);
                  fansDiff = fans - cachedFans;
                } else if (cachedFansStr && cachedDate !== today) {
                  // 如果是新的一天，先计算与昨天基准值的差值
                  const cachedFans = parseInt(cachedFansStr, 10);
                  fansDiff = fans - cachedFans;
                  // 然后更新为今天的基准值
                  await env.FANS_CACHE.put(cacheKey, fans.toString());
                  await env.FANS_CACHE.put(dateKey, today);
                } else {
                  // 第一次访问（没有任何缓存），保存基准值
                  await env.FANS_CACHE.put(cacheKey, fans.toString());
                  await env.FANS_CACHE.put(dateKey, today);
                  fansDiff = 0; // 第一次访问，差值为0
                }
              } catch (kvError) {
                // KV 操作失败，记录错误但不影响主流程
                console.error('KV操作失败:', kvError);
                fansDiff = 0;
              }
            } else {
              // KV 未绑定，直接返回0差值
              fansDiff = 0;
            }
            
            return { userId, name, fans, face, fansDiff, success: true };
          } catch (error) {
            return { userId, name: '', fans: 0, face: '', fansDiff: 0, success: false, error: error.message };
          }
        });
        
        const results = await Promise.all(promises);
        
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // 返回前端页面
    return new Response(HTML_CONTENT, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>B站用户信息</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 30px;
      font-size: 28px;
    }
    
    .user-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
      transition: transform 0.2s;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .user-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .info-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0;
      flex: 1;
    }
    
    .info-item {
      flex: 1;
    }
    
    .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .value {
      color: #333;
      font-size: 24px;
      font-weight: bold;
    }
    
    .name {
      color: #fb7299;
    }
    
    .fans {
      color: #00a1d6;
    }
    
    .fans-diff {
      font-size: 16px;
      font-weight: normal;
      margin-left: 8px;
    }
    
    .fans-diff.positive {
      color: #27ae60;
    }
    
    .fans-diff.negative {
      color: #e74c3c;
    }
    
    .fans-diff.zero {
      color: #95a5a6;
    }
    
    .loading {
      color: #666;
      font-size: 16px;
    }
    
    .error {
      color: #e74c3c;
      background: #fee;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      transition: opacity 0.2s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>B站用户信息</h1>
    <div id="content">
      <div class="loading">加载中...</div>
    </div>
    <button onclick="loadData()">刷新数据</button>
  </div>
  
  <script>
    async function loadData() {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = '<div class="loading">加载中...</div>';
      
      try {
        const response = await fetch('/api/user-info');
        const data = await response.json();
        
        if (data.error) {
          contentDiv.innerHTML = \`<div class="error">错误: \${data.error}</div>\`;
          return;
        }
        
        if (!Array.isArray(data)) {
          contentDiv.innerHTML = '<div class="error">数据格式错误</div>';
          return;
        }
        
        const html = data.map(user => {
          if (!user.success) {
            return \`
              <div class="user-card">
                <div class="error">用户ID \${user.userId}: 加载失败 - \${user.error || '未知错误'}</div>
              </div>
            \`;
          }
          
          const faceUrl = user.face ? \`\${user.face}?t=\${Date.now()}\` : '';
          
          // 计算粉丝数变化显示
          let diffHtml = '';
          if (user.fansDiff !== undefined && user.fansDiff !== 0) {
            const diffClass = user.fansDiff > 0 ? 'positive' : 'negative';
            const diffSign = user.fansDiff > 0 ? '+' : '';
            diffHtml = \`<span class="fans-diff \${diffClass}">(\${diffSign}\${user.fansDiff.toLocaleString()})</span>\`;
          }
          
          return \`
            <div class="user-card">
              <img src="\${faceUrl}" alt="\${user.name || '头像'}" class="avatar" onerror="this.style.display='none'">
              <div class="info-card">
                <div class="info-item">
                  <div class="label">用户名</div>
                  <div class="value name">\${user.name || '未知'}</div>
                </div>
                <div class="info-item">
                  <div class="label">粉丝数</div>
                  <div class="value fans">
                    \${user.fans.toLocaleString() || 0}
                    \${diffHtml}
                  </div>
                </div>
              </div>
            </div>
          \`;
        }).join('');
        
        contentDiv.innerHTML = html || '<div class="error">没有数据</div>';
      } catch (error) {
        contentDiv.innerHTML = \`<div class="error">请求失败: \${error.message}</div>\`;
      }
    }
    
    // 页面加载时自动获取数据
    loadData();
  </script>
</body>
</html>`;

