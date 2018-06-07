'use strict';

const url = require('url');
let request = require('async-request'), response;
const { log } = console;
const config = require('../config');
const cheerio = require('cheerio');


function getTarget(regexp, body) {
  let target;
  body.replace(regexp, (_, t) => {
    target = t;
  });
  return target;

}

async function getNextArticleLink() {
  const url = 'http://1.119.144.204:8912/article/link';
  response = await request(url);
  const body = response.body.toString();
  const data = JSON.parse(body);
  return data.link;
}

async function postReadAndLikeNum(readNum, likeNum) {
  const url = 'http://1.119.144.204:8912/article/readlike';
  var options = {
    method: 'POST',
    data: {
      read_num: readNum,
      like_num: likeNum
    }
  };
  response = await request(url, options);
  const body = response.body.toString();
  const data = JSON.parse(body);
  return data
}

//-------------------------------

const isReadAndLikeNum = function (ctx) {
  const { req } = ctx;
  const link = req.url;
  if (!/mp\/getappmsgext/.test(link)) return false;
  return true;
};

const isArticle = function (ctx) {
  const { req } = ctx;
  const link = req.url;
  const isPost = /mp\.weixin\.qq\.com\/s\?__biz/.test(link);
  const isOldPost = /mp\/appmsg\/show/.test(link);
  if (!(isPost || isOldPost)) return false;
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
    log(readNum, likeNum);
    await postReadAndLikeNum(readNum, likeNum)
  } catch(e) {
    throw e;
  }
};

const handleArticle = async function (ctx) {
  const { req, res } = ctx;
  const link = req.url;
  let body = res.response.body.toString();

  const urlObj = url.parse(link, true);
  const { query } = urlObj;
  const { __biz, mid, idx } = query;
  const [msgBiz, msgMid, msgIdx] = [__biz, mid, idx];
  log(msgBiz, msgMid, msgIdx);
  const nextLink = await getNextArticleLink();
  if (!nextLink) return;
  const insertJsStr = '<meta http-equiv="refresh" content="' + config.insertJsToNextPage.jumpInterval + ';url=' + nextLink + '" />';
  body = body.replace('</title>', '</title>' + insertJsStr);

  return {
    response: { ...res.response, body }
  };
};

module.exports = {
  isReadAndLikeNum,
  isArticle,
  handleReadAndLikeNum,
  handleArticle
};