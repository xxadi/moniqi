// 整数
const positiveInteger = (rule, value, callback) => {
  var reg = /(^[0-9]\d*$)/;
  if (!reg.test(value)) {
    callback(new Error("请填写正整数"));
  } else {
    callback();
  }
};
// 手机号
const validatePhone = (rule, value, callback) => {
  var reg =
    /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/;
  if (!reg.test(value)) {
    callback(new Error("请输入正确的手机号"));
  } else {
    callback();
  }
};
// 邮箱
const validateMail = (rule, value, callback) => {
  var reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  if (!reg.test(value)) {
    callback(new Error("请输入正确的邮箱"));
  } else {
    callback();
  }
};

module.exports = {
  positiveInteger,
  validatePhone,
  validateMail,
};
