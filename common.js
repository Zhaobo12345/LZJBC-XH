/**
 * common.js - 家装平台小程序原型 · 公共脚本
 * 适用于所有 prototype-*.html 页面
 */

(function() {
    'use strict';

    function initPageNav() {
        const pageNav = document.querySelector('.page-nav');
        if (!pageNav) return;

        if (pageNav.querySelector('.page-nav-toggle')) return;

        const firstTitle = pageNav.querySelector('.page-nav-title');
        const titleText = firstTitle ? firstTitle.textContent : '导航';

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'page-nav-toggle';
        toggleContainer.innerHTML = `
            <span class="page-nav-toggle-title">${titleText}</span>
            <span class="page-nav-toggle-icon">◀</span>
        `;

        const contentContainer = document.createElement('div');
        contentContainer.className = 'page-nav-content';

        const childNodes = Array.from(pageNav.childNodes);

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
                return;
            }
            contentContainer.appendChild(node);
        });

        pageNav.innerHTML = '';
        pageNav.appendChild(toggleContainer);
        pageNav.appendChild(contentContainer);

        toggleContainer.addEventListener('click', function(e) {
            e.stopPropagation();
            pageNav.classList.toggle('collapsed');
            
            const isCollapsed = pageNav.classList.contains('collapsed');
            localStorage.setItem('pageNavCollapsed', isCollapsed);
        });

        const savedState = localStorage.getItem('pageNavCollapsed');
        if (savedState === 'true') {
            pageNav.classList.add('collapsed');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNav);
    } else {
        initPageNav();
    }

    window.initPageNav = initPageNav;

})();
