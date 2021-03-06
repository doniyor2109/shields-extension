import 'webext-dynamic-content-scripts';

import { getStore } from './store';
import services from './services_list';
import { ADD_BADGE, REMOVE_BADGE, PAGE_CHANGED, GET_REPO_INFO } from './message';
import { repoInfoMessage } from './message';
import { sendExtensionMessage, onRuntimeMessage } from './chrome';
import { serviceFactory } from './utils'
import { getInfo } from './info';

function createBadgeElement(imgUrl, linkUrl) {
  const anchor = document.createElement('a');
  const img = document.createElement('img');

  // data-canonical-src
  img.dataset.canonicalSrc = imgUrl;
  img.src = imgUrl;
  img.style.maxWidth = '100%';
  img.style.marginLeft = '5px';

  anchor.href = linkUrl || '/';
  anchor.append(img);

  return anchor;
}

function getContainer() {
  const existing =
    // shields.io pattern
    document.querySelector(`.markdown-body.entry-content [data-canonical-src^="https://img.shields.io"][data-canonical-src*=".svg"]`) ||

    // assume if there is badge word it is badge element
    document.querySelector(`.markdown-body.entry-content [data-canonical-src*="badge.svg"]`) ||

    // at least assume that there is svg badge element
    document.querySelector(`.markdown-body.entry-content [data-canonical-src*=".svg"]`);

  if (existing) {
    return existing.parentNode.parentNode;
  }

  const header = document.querySelector('.markdown-body.entry-content h1');

  if (header) {
    const newContainer = document.createElement('p');

    header.append(newContainer);

    return newContainer;
  }

  return document.querySelector('.markdown-body.entry-content');
}

function fetchBadges(callback) {
  getStore('activeBadges', [], (badges) => {
    callback(badges);
  });
}

(async function init() {
  const badgeElements = {};
  const repoInfo = await getInfo();

  function insertBadgeElement(badge) {
    const { id, name } = badge;
    const service = serviceFactory(name, repoInfo);
    const element = badgeElements[id] = createBadgeElement(
      service.buildImgUrl(),
      service.buildLinkUrl(),
    );
    const container = getContainer();
    container && container.append(element);
  }

  function removeBadgeElement(id) {
    if (badgeElements[id]) {
      badgeElements[id].remove();
      delete badgeElements[id];
    }
  }

  function insertBadges(badgeIds) {
    services.forEach((badge) => {
      if (badgeIds.includes(badge.id) && !badgeElements[badge.id]) {
        insertBadgeElement(badge);
      }
    });
  }

  function rehydrate() {
    for (const key in badgeElements) {
      const container = getContainer();

      container && container.append(badgeElements[key]);
    }
  }

  function messageHandler(message) {
    switch (message.type) {
      case ADD_BADGE:
        insertBadges([message.id]);
        break;
      case REMOVE_BADGE:
        removeBadgeElement(message.id);
        break;
      case PAGE_CHANGED:
        rehydrate();
        break;
      case GET_REPO_INFO:
        sendExtensionMessage(repoInfoMessage(repoInfo));
        break;
    }
  }

  fetchBadges(insertBadges);
  onRuntimeMessage(messageHandler);
})();
