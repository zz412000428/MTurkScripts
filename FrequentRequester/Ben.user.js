// ==UserScript==
// @name         Ben
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  summarize short words
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1ZTPSR8SWFK03",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_text() {
        var conj_reg=/(.{8,10})\s(and|or|but|if|after|because|before|that|in|for)\s.*$/;
        var split=my_query.text.split("\."),next,first,i;
        var to_regex=/^.*\s(and be(?:come)|to (attend|practice|start|work|get|be(?:come)?)\s.{3,})/
        for(i=0;i<split.length;i++) {
            first=split[i];
            if(to_regex.test(first)) {
                next=first.replace(to_regex,"$1")
                    .replace(conj_reg,"$1");
                next=next.replace(/\smy\s/," your ").replace(/\smyself\s/," yourself ").replace(/,\s+.*$/,"");
                my_query.fields.Q5FreeTextInput=next.replace(/^to /,"");
                add_to_sheet();
                return;
            }
            if(/(hope|plan) (?:to|on) ([a-z]*ing)\s/i.test(first)) {

                next=first.replace(/^.*\s(?:hope|plan) (?:to|on) ([a-z]*)ing/i,"$1")
                    .replace(conj_reg,"$1");
                next=next.replace(/\smy\s/," your ").replace(/\smyself\s/," yourself ").replace(/,\s+.*$/,"");
                my_query.fields.Q5FreeTextInput=next.replace(/^to /,"");
                add_to_sheet();
                return;
            }
            if(/(hope|plan) (?:to|on)\s/i.test(first)) {

                next=first.replace(/^.*\s(?:hope|plan) (?:to|on)\s/i,"")
                    .replace(conj_reg,"$1");
                next=next.replace(/\smy\s/," your ").replace(/\smyself\s/," yourself ").replace(/,\s+.*$/,"");
                my_query.fields.Q5FreeTextInput=next.replace(/^to /,"");
                add_to_sheet();
                return;
            }
            if(/\sis to/.test(first)) {
                next=first.replace(/^.*\sis to/i,"")
                    .replace(conj_reg,"$1");
                next=next.replace(/\smy\s/," your ").replace(/\smyself\s/," yourself ").replace(/,\s+.*$/,"");
                my_query.fields.Q5FreeTextInput=next.replace(/^to /,"");
                add_to_sheet();
                return;
            }
        }


    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var b=document.querySelectorAll("form b");
        my_query={text:b[1].innerText,fields:{Q5FreeTextInput:""},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        parse_text();
       
    }

})();