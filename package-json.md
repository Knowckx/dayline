### 梳理依赖需求
"devDependencies": {
    // vite + ts的依赖
    "vite": "^8.1.3",
    "typescript": "^6.0.3",
    "@types/node": "^26.1.0",

    // svelte 相关依赖
    "svelte": "^5.56.4",
    "@sveltejs/vite-plugin-svelte": "^7.1.2",
    "@lucide/svelte": "^1.23.0", // lucide是图标

    // tailwindcss 核心
    "tailwindcss": "^4.3.2",
    "@tailwindcss/vite": "^4.3.2", 
    "tw-animate-css": "^1.4.0",  // 启用动画类，比如弹窗、Toast

    // pwa 相关
    "vite-plugin-pwa": "^1.3.0",
    "vite-plugin-mkcert": "^2.1.0",
    "workbox-window": "^7.4.1"
},

"dependencies": {
    "@knowckx/infa-s5": "workspace:*",
}



