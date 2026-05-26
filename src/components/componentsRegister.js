import Vue from "vue";

import SearchPanel from "@/components/SearchPanel";
import PageTable from "@/components/PageTable";
import EditForm from "@/components/EditForm";
import DetailForm from "@/components/DetailForm";

// 注册到全局
Vue.component("cs-searchpanel", SearchPanel);
Vue.component("cs-pagetable", PageTable);
Vue.component("cs-editform", EditForm);
Vue.component("cs-detailForm", DetailForm);
