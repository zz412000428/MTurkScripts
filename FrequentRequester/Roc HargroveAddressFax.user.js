// ==UserScript==
// @name         Roc HargroveAddressFax
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/cacadbd55536aeccfae3d3760e2c302e4c333f9c/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=['.healthgrades.com','.vitals.com','.medicarelist.com','.healthcare4ppl.com','.yelp.com','.zocdoc.com',
                 '.npidb.com','/npino.com','.ehealthscores.com','/npiprofile.com','/healthprovidersdata.com','.usnews.com','.doximity.com',
                 '.linkedin.com','.sharecare.com','.caredash.com','.healthcare6.com','.topnpi.com','.md.com','.yellowpages.com','.mapquest.com',
                 '.hipaaspace.com','.spokeo.com','/npidb.com','.webmd.com','.whitepages.com','.bizapedia.com','.facebook.com',".myheritage.com",
                 '.beenverified.com','.peoplefinders.com','.doctorhelps.com','.instantcheckmate.com','.wikipedia.org','/npidb.org',
                 '.medicinenet.com'];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A1SK2GV23YJWN9",true);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.url) {
                resolve(parsed_context.url);
                return;
            }
            else if(parsed_context.people&&parsed_context.people.length>0 && parsed_context.people[0].url!==undefined) {
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                if(type==='webmdquery' && i>=3) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if((!MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1)||

                    (type==='webmdquery' && /\.webmd\.com/.test(b_url) && /\/doctor\//.test(b_url) && !/find\-a\-doctor\//.test(b_url))) &&  (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
    	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
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
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        if(/\.webmd\.com/.test(result)) {
            return;
        }
    
        my_query.fields['09_website_01']=result;
        add_to_sheet();
        var promise=MTP.create_promise(my_query.practice_url,Address.scrape_address,address_scrape_then,function(response) {
            console.log("Failed address"); },{type:"",depth:0});

    }

    function webmdquery_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.practice_url=result;
        result=result.replace(/\-overview$/,'-appointments');
        let promise=MTP.create_promise(result,query_web_md,query_web_md_then,function(result) {
            console.log("FAiled");
            GM_setValue("returnHit",true); });


    }
    function address_scrape_then(result) {
        //console.log("result="+result);
        Address.addressList.sort(function(a,b) { return a.priority-b.priority; });
        //console.log("addressList="+JSON.stringify(Address.addressList));
        if(Address.addressList.length>=1) {
            update_address(Address.addressList[0],'01');
            add_to_sheet();
        }
    }

    function query_web_md(doc,url,resolve,reject) {
        console.log("query_web_md,url="+url);
        var specialty;

        try {
            specialty=doc.querySelector(".prov-specialty-name").innerText.trim();
            specialty=specialty.replace("Geriatric Medicine","Geriatrics").replace("Pulmonary Disease","Pulmonary Medicine")
            .replace(/^Diabetes$/,"Endocrinology, Diabetes, & Metabolism").replace("General Practice","Internal Medicine")
            .replace("Child & Adolescent Psychiatry","Psychiatry").replace("Pulmonary Critical Care","Pulmonary Medicine")
            .replace("Cardiovascular Disease","Cardiology").replace("Endocrinology, Diabetes & Metabolism","Endocrinology, Diabetes, & Metabolism")
            .replace("Podiatric Medicine","Podiatry").replace("Child Neurology","Neurology").replace("Hematology/Oncology","Hematology & Oncology")
            .replace("Pediatric Pulmonology","Pulmonary Medicine");
            console.log("SPECIALTY: "+specialty);
            document.querySelector("[name='Select Specialty 1']").value=specialty;
        }
        catch(err) {
            console.log("specialty name not found"); }

        var loc=doc.querySelector(".location-practice-name a");
        if(my_query.fields['09_website_01']!==undefined &&my_query.fields['09_website_01'].length>0) return;
        let promise=MTP.create_promise(loc.href,query_md_practice,resolve,reject);
    }

    function query_md_practice(doc,url,resolve,reject) {
        console.log("query_web_md_practice,url="+url);
        //if(my_query.fields['09_website_01'].length>0) return;
        var name,add_text,add;
        name=doc.querySelector(".topoffice h4");
        if(my_query.fields['09_website_01']!==undefined &&my_query.fields['09_website_01'].length>0) return;
        try {
            add_text=doc.querySelector('.address strong').innerHTML.replace('<br>','\n').trim();
        }
        catch(error) {
            console.log("bad md_query");
            return;
        }
        add=new Address(add_text,-50);
        var phone=doc.querySelector(".practicephone").innerText.trim();
        var fax=doc.querySelector("[itemprop='faxNumber']").innerText.trim().replace(/^\s*Fax:\s*/,"");
        my_query.fields['01_office_name1_01']=name.innerText.trim();
        my_query.fields['07_phone_01']=phone;
        my_query.fields['08_fax_01']=fax;
        my_query.fields['09_website_01']=url;
        update_address(add,'01');
        add_to_sheet();


    }

    function query_web_md_then(result) {
        console.log("query_web_md_then,result="+JSON.stringify(result));
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
        //update_address();
        for(x in my_query.fields) {
            if(/^undefined/.test(x)) continue;
            //console.log("my_query.fields["+x+"]="+my_query.fields[x]);
            if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
   
    function update_address(address,suffix) {
        var top,x;
        top=address;
        //console.log("address="+JSON.stringify(address));
        top.zip=top.postcode;
        console.log("top="+JSON.stringify(top));
        var add_field_prefix={"office_name1_01":"01","address1_01":"02",
                              "address2_01":"03","city_01":"04","state_01":"05","zip_01":"06","phone_01":"07","fax_01":"08",
                             "office_name1_02":"10","address1_02":"11",
                              "address2_02":"12","city_02":"13","state_02":"14","zip_02":"15","phone_02":"16","fax_02":"17"};

        for(x in top) {
            //console.log("Adding "+x+"_"+suffix);
            my_query.fields[add_field_prefix[x+"_"+suffix]+"_"+x+"_"+suffix]=top[x]; }


    }
    function remove_phones(text,suffix,target) {
        var split=text.split(/\n/);

        var ret="",match,matched_phone=false,i;
        var phone_prefix_map={"01":"07","02":"16"},fax_prefix_map={"01":"08","02":"17"};
        var pasted_name=/office_name/.test(target.name),fax_match;
        for(i=0;i<split.length;i++) {
            if(fax_match=split[i].match(/Fax:\s*([\(]?[0-9]{3}([\)]?[-\s\.\/]|\))[0-9]{3}[-\s\.\/]+[0-9]{4,6})/)) {
                my_query.fields[fax_prefix_map[suffix]+"_fax_"+suffix]="1"+fax_match[1].replace(/[^\d]+/g,"");
                split[i]=split[i].replace(fax_match[0],'');

            }
            if(i==0 && pasted_name && !/[\d]/.test(split[i])) {
                console.log("Added "+(suffix==="01"?"01":"10")+"office_name1_"+suffix+" to equal "+split[i].trim());
                my_query.fields[(suffix==="01"?"01":"10")+"_office_name1_"+suffix]=split[i].trim();
                continue;
            }
            match=split[i].match(phone_re);
            if(match) {
                if(!matched_phone && (matched_phone=true)) {
                    my_query.fields[phone_prefix_map[suffix]+"_phone_"+suffix]=match[0].replace(/[^\d]+/g,"");
                }
                else {
                    my_query.fields[fax_prefix_map[suffix]+"_fax_"+suffix]="1"+match[0].replace(/[^\d]+/g,""); }
            }
            else {
                ret=ret+(ret.length>0?"\n":"")+split[i];
            }
        }
        console.log("Returning ret="+ret);
        return ret;
    }
    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var match=e.target.name.match(/_([^_]*)$/);

        var suffix=match?match[1]:"01";
        if(text.indexOf("\n")===-1 && !my_query.fields[e.target.name]) my_query.fields[e.target.name]=text;
        text=text.replace(/\s\|\s/g,"\n");
        console.log("text="+text);
        text=remove_phones(text,suffix,e.target);
        text=text.replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("e.target.name="+e.target.name);
        console.log("text="+text);
        var my_add=new Address(text,-50);
        if(my_add.priority<1000) {
            update_address(my_add,suffix); }
        add_to_sheet();
     //  add_text(text);
    }
    function do_phone_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(/fax/.test(e.target.name)) text="1"+text;
        my_query.fields[e.target.name]=text;
        add_to_sheet();
    }

    function addr_cmp(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    }

    function init_Query()
    {
        console.log("in init_query rochargrove");
        var i,x;

        var links=document.querySelectorAll("form a");
        links[2].href=links[2].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"")
        var my_href=links[2].href.replace(/\+Fax$/i,"").replace(/\+NULL/ig,"").replace(/\%20/g," ").replace(/^.*\?q\=(.*)$/,"$1");

        var split=my_href.split("++");
               split[0]=split[0].replace(/\+/g," ");
        if(split.length<2) {
            let my_match_re=/^(.*)\s((?:[^\s]+)\s(?:[^\s]+))$/;
            let match=my_href.replace(/\+/g," ").match(my_match_re);
            if(match) {
                split=[match[1],match[2]];
            }
        }
        split[1]=split[1].replace(/\+/g," ");
        console.log("my_href="+my_href+",split="+split);

        var their_query_str=split[0];//document.querySelectorAll("form div div span")[2].innerText.trim();
        console.log("their_query_str="+their_query_str);
        var name_re=/^([A-Z\-\s\.,]+)?\s(?:(?:MD)|(?:DO)|(?:FNP)|(?:NP)\s)?(.*)$/;
      //var end_re=/[A-Z][a-z]+(\s)
        var name_match=their_query_str.match(name_re);
        if(name_match && name_match[1]) {
            //name_match[1]=name_match[1].replace(/\s(MD|DO|FNP|Physician|NP).*$/,"");
        }
        var state_match=split[1].match(/ ([A-Z]{2})\s*$/);
        console.log("name_match="+JSON.stringify(name_match));
        var phone_list=["07_phone_01","08_fax_01","16_phone_02","17_fax_02"];
        document.getElementsByName("02_address1_01")[0].addEventListener("paste",do_address_paste);
         document.getElementsByName("01_office_name1_01")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("10_office_name1_02")[0].addEventListener("paste",do_address_paste);
        document.getElementsByName("11_address1_02")[0].addEventListener("paste",do_address_paste);

        for(x of phone_list) {
            document.querySelector("[name='"+x+"']").addEventListener("paste",do_phone_paste);
        }
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:name_match?name_match[1]:'',state:state_match?reverse_state_map[state_match[1]]:'',url:"",fields:
                  {},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
         var search_str=my_query.name+" "+name_match[2]+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);


        });
const webmdqueryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:webmd.com", resolve, reject, query_response,"webmdquery");
        });
        webmdqueryPromise.then(webmdquery_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });


     //  var promise=MTP.create_promise(my_query.url,parse_hpd,parse_hpd_then);
    }

})();