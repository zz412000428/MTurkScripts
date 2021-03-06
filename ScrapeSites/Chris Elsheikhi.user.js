// ==UserScript==
// @name         Chris Elsheikhi
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
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_deleteValue
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"AKLDE41K3WWS2");
    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");
	    b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
		if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
		resolve(b_url);
		return;
	    }


        }
        catch(error)
	{
	    reject(error);
            return;
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }
    function parse_youtube_inner(text) {
        var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
        try { parsed=JSON.parse(text); }
        catch(error) { console.log("error parsing="+error+", text="+text); return; }
        tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
        for(i=0; i < tabs.length; i++) if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
        if(!content) return ret;
        contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
        if((label=contents.businessEmailLabel)===undefined) ret.email="";
        if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
           runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
        if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
        if((links=contents.primaryLinks)===undefined) links=[];
        for(i=0; i < links.length; i++) {
            url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
            console.log("url["+i+"]="+url);
            if(/instagram\.com/.test(url)) ret.insta=url; 
            else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about"; 
            else if(/twitter\.com/.test(url)) ret.twitter=url;
            else if(!/plus\.google\.com|((youtube|gofundme|patreon)\.com)/.test(url) && i===0) ret.url=url;
        }
        if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
            if(match=ret.description.match(email_re)) ret.email=match[0];
            if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
            if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
        }
        if(contents.businessEmailLabel===undefined) ret.businessEmailLabel=false;
        else ret.businessEmailLabel=true;
        return ret;
    }


    function parse_youtube(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,script_regex_begin=/^\s*window\[\"ytInitialData\"\] \=\s*/,text;
        var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret=null,x,promise_list=[];
        var email_match,match;
        for(i=0; i < scripts.length; i++) {
            if(script_regex_begin.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(script_regex_begin,"");
                console.log(text.indexOf(";"));
                if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
                ret=parse_youtube_inner(text);      
                if(!ret) {
                    my_query.fields.email="NULL";
                    my_query.done.web=my_query.done.fb=my_query.done.insta=true;
                    submit_if_done();
                    return; }
                break;
            }
        }
        my_query.emailBusinessLabel=ret.businessEmailLabel;
        //console.log("my
        if(ret.description && (email_match=ret.description.match(email_re)) && (my_query.fields.email=email_match[0])) submit_if_done();
        else { console.log("email_match="+email_match); }
        if(ret.description) {
            if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
            if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
        }
        console.log("ret="+JSON.stringify(ret));

        if(ret.insta) promise_list.push(MTurkScript.prototype.create_promise(ret.insta,MTurkScript.prototype.parse_instagram,parse_insta_then));
        else if(my_query.done["insta"]=true) submit_if_done();
        if(ret.fb) promise_list.push(MTurkScript.prototype.create_promise(ret.fb,MTurkScript.prototype.parse_FB_about,parse_fb_then));
        else if(my_query.done["fb"]=true) submit_if_done();
        if(ret.url && my_query.fields.email.length===0) {

            call_contact_page(ret.url,submit_if_done);
        }
        else { my_query.done["web"]=true; submit_if_done(); }

    }

    function parse_insta_then(result) {
        var match;
        console.log("insta_result: "+JSON.stringify(result));
        if(result.success && result.email) { my_query.fields.email=result.email; }
        if(result.biography && (match=result.biography.match(email_re))) my_query.fields.email=match[0];
        my_query.done["insta"]=true;
        submit_if_done();

    }
    function parse_fb_then(result) {
        console.log("fb_result: "+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; }
        my_query.done["fb"]=true;
        submit_if_done();

    }



    function parse_youtube_then(result) {
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function add_to_sheet() {
        var x;
        for(x in my_query.fields) {
            if(document.getElementById(x)) document.getElementById(x).value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        add_to_sheet();
        var is_found=true;
        console.log("MTurk.doneQueries="+MTurk.doneQueries+"\nMTurk.queryList="+JSON.stringify(MTurk.queryList)
                    +"\tlength="+MTurk.queryList.length+"\tmy_query.done="+JSON.stringify(my_query.done)+"\tmy_query.submitted="+my_query.submitted);

        var is_done=true,x;
        if(MTurk.queryList.length>0 && MTurk.doneQueries >= MTurk.queryList.length) my_query.done["web"]=true;
        for(x in my_query.done) { if(!my_query.done[x]) is_done=false; }

        for(x in my_query.fields) { if(my_query.fields[x].length===0||my_query.fields[x]==="NULL") is_found=false; }
        if(is_done && is_found &&!my_query.submitted && MTurk.doneQueries >= MTurk.queryList.length && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done && !my_query.submitted && MTurk.doneQueries >= MTurk.queryList.length) {
            if(!my_query.emailBusinessLabel) {
                my_query.fields.email="NULL";
                add_to_sheet();
                MTurk.check_and_submit();
                return;
            }
            console.log("Failed");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return; }
    }

    function call_contact_page(url,callback,extension) {
        if(extension===undefined) { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");

                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    }


    /**
     * contact_response Here it searches for an email */
    function contact_response(doc,url,extra) {
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        if(extension===undefined) extension='';
        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Privacy|Legal)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurkScript.prototype.is_bad_email(email_matches[j]) && email_matches[j].length>0 && my_query.fields.email.length===0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(my_query.fields.email==="jacobmas@gmail.com") my_query.fields.email="";

        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {

            if(my_query.fields.email.length>0) break;
            // console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email) && my_query.fields.email.length===0) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
              (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)&& my_query.fields.email.length===0) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            if(my_query.fields.email==="jacobmas@gmail.com") my_query.fields.email="";
        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        callback();
        return;
    }

    function begin_script(timeout,total_time,callback) {
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;

            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function init_Query()
    {

        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
	//var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:wT.rows[0].cells[1].innerText+"/about",fields:{email:""},submitted:false,done:{"insta":false,"fb":false,"web":false}};
        console.log("my_query.url="+my_query.url);
        var promise=MTurkScript.prototype.create_promise(my_query.url,parse_youtube,parse_youtube_then);
	var search_str;
      
    }

})();