# JL吉林COSMIC 部署说明

## Controller 放置
将 `controller/JiLinCOSMICController.java` 放到通用项目以下位置：
`/safeassets_ty/mis/src/main/java/com/neusoft/mid/controller/gen/JiLinCOSMICController.java`

## Iframe 页面放置
将 `iframe/jiLinCOSMIC` 目录整体放到通用项目以下位置：
`/safeassets_ty/mis/src/main/resources/templates/gen/jiLinCOSMIC/`

## SQL 权限脚本
将 `sql/ji_lin_cosmic_permission.sql` 导入数据库，用于生成菜单和权限数据。
