module.exports = process.env.SPIDER_COV
  ? require('./lib-cov/spider')
  : require('./lib/spider');
