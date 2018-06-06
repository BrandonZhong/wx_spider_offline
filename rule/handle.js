'use strict';

const url = require('url');
const moment = require('moment');
const { log } = console;
const config = require('../config');
const cheerio = require('cheerio');

const isReadAndLikeNum = function (ctx) {
  const { req } = ctx;
  const link = req.url;
  if (!/mp\/getappmsgext/.test(link)) return false;
  return true;
};

const handleReadAndLikeNum = async function (ctx) {
  try {
    const { req, res } = ctx;
    const body = res.response.body.toString();
    const data = JSON.parse(body);
    const { read_num, like_num } = data.appmsgstat;
    const [readNum, likeNum] = [read_num, like_num];

    const { requestData } = req;
    const reqData = String(requestData);
    const reqArgs = reqData.split('&').map(s => s.split('='));
    const reqObj = reqArgs.reduce((obj, arr) => {
      const [key, value] = arr;
      obj[key] = decodeURIComponent(value);
      return obj;
    }, {});
    const { __biz, mid, idx } = reqObj;
    const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];
    log(msgBiz, msgMid, msgIdx);
    log(readNum, likeNum);
  } catch(e) {
    throw e;
  }
};

const isArticle = function (ctx) {
  const { req } = ctx;
  const link = req.url;
  const isPost = /mp\.weixin\.qq\.com\/s\?__biz/.test(link);
  const isOldPost = /mp\/appmsg\/show/.test(link);
  if (!(isPost || isOldPost)) return false;
  return true;
};
function getTarget(regexp, body) {
  let target;
  body.replace(regexp, (_, t) => {
    target = t;
  });
  return target;

}

function getNextArticleLink() {
  const apiUrl = '';


}

const handleArticle = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  let body = res.response.body.toString();

  const urlObj = url.parse(link, true);
  const { query } = urlObj;
  const { __biz, mid, idx } = query;
  const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];

  const insertJsStr = '<meta http-equiv="refresh" content="' + config.insertJsToNextPage.jumpInterval + ';url=' + nextLink + '" />';
  body = body.replace('</title>', '</title>' + insertJsStr);

  return {
    response: { ...res.response, body }
  };
};