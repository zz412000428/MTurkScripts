// ==UserScript==
// @name         ASOC_Municipal
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  ASOC get FB and Twitter School Agency
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com*
// @include https://*twitter.com*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["dandb.com","buzzfile.com","hometownlocator.com","roadonmap.com","wikipedia.org","facebook.com","city-data.com","mapquest.com",
                 "yelp.com","zipcode.org"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    var word_version={"1":"One","2":"Two","3":"Three","4":"Four","5":"Five","6":"Six","7":"Seven"};
    var area_code_map={"201":"New Jersey","202":"District of Columbia","203":"Connecticut","204":"Manitoba","205":"Alabama","206":"Washington",
                        "207":"Maine","208":"Idaho","209":"California","210":"Texas", "212":"New York","213":"California","214":"Texas","215":"Pennsylvania",
                        "216":"Ohio","217":"Illinois","218":"Minnesota","219":"Indiana","224":"Illinois","225":"Louisiana","228":"Mississippi",
                        "229":"Georgia","231":"Michigan","234":"Ohio", "239":"Florida","240":"Maryland","242":"Bahamas","246":"Barbados", "248":"Michigan",
                        "250":"British Columbia","251":"Alabama","252":"North Carolina","253":"Washington","254":"Texas","256":"Alabama","260":"Indiana",
                        "262":"Wisconsin","264":"Anguilla","267":"Pennsylvania","268":"Antigua\/Barbuda","269":"Michigan","270":"Kentucky","276":"Virginia",
                        "281":"Texas","284":"British Virgin Islands","289":"Ontario","301":"Maryland","302":"Delaware","303":"Colorado","304":"West Virginia",
                        "305":"Florida","306":"Saskatchewan","307":"Wyoming","308":"Nebraska","309":"Illinois","310":"California","312":"Illinois",
                        "313":"Michigan","314":"Missouri","315":"New York","316":"Kansas","317":"Indiana","318":"Louisiana","319":"Iowa",
                        "320":"Minnesota","321":"Florida","323":"California","325":"Texas","330":"Ohio","334":"Alabama","336":"North Carolina",
                        "337":"Louisiana","339":"Massachusetts","340":"US Virgin Islands","345":"Cayman Islands","347":"New York","351":"Massachusetts",
                        "352":"Florida","360":"Washington","361":"Texas","386":"Florida","401":"Rhode Island","402":"Nebraska","403":"Alberta","404":"Georgia",
                        "405":"Oklahoma","406":"Montana","407":"Florida","408":"California","409":"Texas","410":"Maryland","412":"Pennsylvania",
                        "413":"Massachusetts","414":"Wisconsin","415":"California","416":"Ontario","417":"Missouri","418":"Quebec","419":"Ohio","423":"Tennessee",
                        "425":"Washington","430":"Texas","432":"Texas","434":"Virginia","435":"Utah","440":"Ohio","441":"Bermuda","443":"Maryland","450":"Quebec",
                        "456":"NANP area","469":"Texas","473":"Grenada","478":"Georgia","479":"Arkansas","480":"Arizona","484":"Pennsylvania","501":"Arkansas","502":"Kentucky","503":"Oregon","504":"Louisiana","505":"New Mexico","506":"New Brunswick","507":"Minnesota","508":"Massachusetts","509":"Washington","510":"California","512":"Texas","513":"Ohio","514":"Quebec","515":"Iowa","516":"New York","517":"Michigan","518":"New York","519":"Ontario","520":"Arizona","530":"California","540":"Virginia","541":"Oregon","551":"New Jersey","559":"California","561":"Florida","562":"California","563":"Iowa","567":"Ohio","570":"Pennsylvania","571":"Virginia","573":"Missouri","574":"Indiana","580":"Oklahoma","585":"New York","586":"Michigan","601":"Mississippi","602":"Arizona","603":"New Hampshire","604":"British Columbia","605":"South Dakota","606":"Kentucky","607":"New York","608":"Wisconsin","609":"New Jersey","610":"Pennsylvania","612":"Minnesota","613":"Ontario","614":"Ohio","615":"Tennessee","616":"Michigan","617":"Massachusetts","618":"Illinois","619":"California","620":"Kansas","623":"Arizona","626":"California",
                        "630":"Illinois","631":"New York","636":"Missouri","641":"Iowa","646":"New York","647":"Ontario","649":"Turks &amp; Caicos Islands","650":"California","651":"Minnesota","660":"Missouri","661":"California","662":"Mississippi","664":"Montserrat","670":"CNMI","671":"Guam","678":"Georgia","682":"Texas","701":"North Dakota","702":"Nevada","703":"Virginia","704":"North Carolina","705":"Ontario","706":"Georgia","707":"California","708":"Illinois","709":"Newfoundland",
                        "710":"US","712":"Iowa","713":"Texas","714":"California","715":"Wisconsin","716":"New York","717":"Pennsylvania","718":"New York","719":"Colorado","720":"Colorado","724":"Pennsylvania","727":"Florida","731":"Tennessee","732":"New Jersey","734":"Michigan","740":"Ohio",
                        "754":"Florida","757":"Virginia","758":"St. Lucia","760":"California","763":"Minnesota","765":"Indiana","767":"Dominica","770":"Georgia","772":"Florida","773":"Illinois","774":"Massachusetts","775":"Nevada","778":"British Columbia","780":"Alberta","781":"Massachusetts","784":"St. Vincent &amp; Grenadines","785":"Kansas","786":"Florida","787":"Puerto Rico","801":"Utah","802":"Vermont","803":"South Carolina","804":"Virginia","805":"California","806":"Texas","807":"Ontario","808":"Hawaii",
                        "809":"Dominican Republic","810":"Michigan","812":"Indiana","813":"Florida","814":"Pennsylvania","815":"Illinois","816":"Missouri","817":"Texas","818":"California","819":"Quebec","828":"North Carolina","830":"Texas","831":"California","832":"Texas","843":"South Carolina","845":"New York","847":"Illinois",
                       "848":"New Jersey","850":"Florida","856":"New Jersey","857":"Massachusetts","858":"California","859":"Kentucky","860":"Connecticut","862":"New Jersey",
                       "863":"Florida","864":"South Carolina","865":"Tennessee","867":"Yukon, NW Terr., Nunavut","868":"Trinidad &amp; Tobago","869":"St. Kitts &amp; Nevis","870":"Arkansas","876":"Jamaica","878":"Pennsylvania","880":"NANP area","881":"NANP area","882":"NANP area","901":"Tennessee","902":"Nova Scotia","903":"Texas","904":"Florida","905":"Ontario","906":"Michigan","907":"Alaska","908":"New Jersey","909":"California","910":"North Carolina","912":"Georgia","913":"Kansas","914":"New York","915":"Texas","916":"California","917":"New York","918":"Oklahoma","919":"North Carolina","920":"Wisconsin","925":"California","928":"Arizona","931":"Tennessee","936":"Texas","937":"Ohio","939":"Puerto Rico","940":"Texas","941":"Florida","947":"Michigan","949":"California","951":"California","952":"Minnesota",
                        "954":"Florida","956":"Texas","970":"Colorado","971":"Oregon","972":"Texas","973":"New Jersey","978":"Massachusetts","979":"Texas","980":"North Carolina","985":"Louisiana","989":"Michigan"};

    function check_function() { return true;  }
    function check_and_submit(check_function)
    {
        var end_time=new Date().getTime();
        var time_elapsed=end_time-my_query.begin_time;
        console.log("in check "+time_elapsed);
        my_query.tot_attempts++;
        my_query.tot_time=my_query.tot_time+time_elapsed;
        var avg_time=my_query.tot_time*1./my_query.tot_attempts;
        console.log("Average time: "+avg_time);
        GM_setValue("attempts",my_query.tot_attempts);
        GM_setValue("time",my_query.tot_time);
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");
        var fb_color=document.getElementsByName("FB URL")[0].style.backgroundColor;
        var twitter_color=document.getElementsByName("Twitter URL")[0].style.backgroundColor;
        console.log("fb_color=("+fb_color+", "+typeof(fb_color)+"=rgbstuff="+
                    (fb_color==="rgb(255, 255, 255)")+
                    "), twitter_color="+twitter_color);
	if(GM_getValue("automate") &&
       ((document.getElementsByName("FB URL")[0].style.backgroundColor==="rgb(255, 255, 255)"
        ) &&
       (document.getElementsByName("Twitter URL")[0].style.backgroundColor==="rgb(255, 255, 255)")))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 250);
        }
    }


    /* Creates a promise where it does a standard GM_xmlhttpRequest GET thing, on which point it
   does the DOMParser thing, loads the parser taking (doc,url,resolve,reject)

   and the promise does (mandatory) then_func on resolving, (optional, otherwise just prints a message) catch_func on
   rejecting
*/
    function myxor(a,b)
    {
        return (a&&!b)||(!a && b);
    }

    function try_bad_name_again(b_name,p_caption,site,pos)
    {
       // console.log("in try_bad_name");
        if(/(^|\s|,)Mt\.($|\s|,)/.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)Mt\.($|\s|,)/,"$1Mount$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)St\.($|\s|,)/.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)St\.($|\s|,)/,"$1Saint$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)St\./.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)St\./,"$1Saint ");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)ISD($|\s|,)/i.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)ISD($|\s|,)/i,"$1I.S.D.$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)Twp(\.?)(\s|$|,)/i.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)Twp(\.?)(\s|$|,)/i,"$1Township$2");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/\s-\s/.test(b_name))
        {
            b_name=b_name.replace(/\s-\s/g,"-");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/-/.test(b_name))
        {
            b_name=b_name.replace(/-/g," ");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        return true;
    }

    function acronym(text)
    {
        text=text.replace(/([A-Za-z]{1})-([A-Za-z]{1])/,"$1 $2");
        var ret="",t_split=text.split(" ");
        for(var i=0; i < t_split.length; i++)
            if(/[A-Z]+/.test(t_split[i].substr(0,1))) ret=ret+t_split[i].charAt(0);
        return ret;
    }

    function is_school_district(text)
    {
        return /(\s|^|[a-z]+)(District|Schools|Public School|Local School|((I(\.)?)?S(\.)?D(\.)?)|USD)([\s,]+|$)/i.test(text);
    }

    function is_bad_name(b_name,p_caption,site,pos)
    {
        b_name=b_name.replace(/^The\s*/,"").replace(/\'/g,"").replace(/^(Welcome to|Government of) (the )?/i,"");
        b_name=b_name.replace(/(Village|Government|City) Offices/i,"$1");
        if(site==="twitter")
        {
            b_name=b_name.replace(/\(@.*$/,"").trim();
            b_name=b_name.replace(/([a-z]{1})([A-Z]{1})/g,"$1 $2");
            b_name=b_name.replace(/^Vlg/i,"Village").replace(/(\s|^)Boro(\s|$)/i,"$1Borough$2");
            b_name=b_name.replace(new RegExp(my_query.state+"([A-Z]{1}[a-z]{1})"),my_query.state+" $1");
        }
        if(site==="facebook")
        {
            b_name=b_name.replace(/\s\|.*$/,"").replace(/ - Home.*$/,"").replace(/ - .*$/,"").trim();
        }
        var orig_b_name=b_name;
        b_name=b_name.toLowerCase().trim();

        var name_minus_state=my_query.agency_name.replace(/,.*$/,"");
        var state_regexp=new RegExp("(\\s|,)"+my_query.state+"(\\s|$|\\.)");
         var county_acronym=acronym(my_query.agency_name.replace(/,.*$/,""));
        var x,bad_state_reg;
        for(x in reverse_state_map)
        {
            if(x===my_query.state) continue;
            bad_state_reg=new RegExp(my_query.short_name+",\\s*"+reverse_state_map[x],"i");
           // console.log("bad_state_reg="+bad_state_reg+", b_name="+b_name);
            if(bad_state_reg.test(b_name))
            {
                console.log("Wrong state, found "+reverse_state_map[x]+", should be "+reverse_state_map[my_query.state]);
                return true;
            }
        }
        console.log("# b_name="+b_name+", county_acronym="+county_acronym);

        var name_regexp=new RegExp("(^|[^A-Za-z]{1})"+my_query.short_name.toLowerCase().replace(/-/,"(-|\\s)")+"($|[^A-Za-z]{1})");

        console.log(name_regexp+".test("+b_name+")="+name_regexp.test(b_name));
//b_name.indexOf(my_query.short_name.toLowerCase())===-1           && b_name.indexOf(my_query.short_name.toLowerCase().replace(/-/g," "))===-1
        if(!name_regexp.test(b_name)
          && !(county_acronym.length>1 && new RegExp(county_acronym,"i").test(b_name))
          )
        {

                console.log("Failed to find "+my_query.short_name.toLowerCase());
                return try_bad_name_again(orig_b_name,p_caption,site,pos);

        }
       /* else if(!/^(City|Town|Village|County|Municipality|Township|Borough)/i.test(b_name)
                && b_name.indexOf(my_query.short_name.toLowerCase())>0)
        {
            console.log("Bad beginning");
            return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }*/
        else if((pos>0) && !state_regexp.test(orig_b_name) &&
                //orig_b_name.indexOf(my_query.state+".")===-1 &&
                b_name.indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
                &&
                !state_regexp.test(p_caption) &&
         //   p_caption.indexOf(my_query.state+".")===-1 &&
                p_caption.toLowerCase().indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
            && b_name.indexOf(name_minus_state.toLowerCase())===-1)
        {
            console.log("Failed to find state");
            if(site!=="twitter")
            {
//                return try_bad_name_again(orig_b_name,p_caption,site,pos);
            }
        }
        var bad_places="Baptist|Church|Firefighters|Fire|Police|Sports|Sport|Baptist|Cool|([A-Z]*ISD)|Chamber|FFA|PBA|Pulse|"+
            "Magazine|Store|Liquor|Hockey[a-z]*|City Council|Recreation|Program|Committee|Democratic|Auto[a-z]*|Club|"+
            "Tourism|Wildlife|GOP|Democrat[a-z]*|Neighborhood Watch|Art|Mountain|Athletics|Library|Baseball|Football|Magazine|"+
            "Medical|Soccer|Patch|Pharmacy|Rec|Yoga|Resort|Development|Company|FPG|Herald|Tribune|Star|Times|UMC|Country Club|"+
            "Planning|Neighborhood|Clerk|Department|Recreation|Program|Committee|Office of|"+
            "Ambulance|School|"+
            "PD|FD|"
            "USD|ISD|School[a-z]{0,1}|HS|Elementary";
        var bad_twitter_places="([A-Z]{1}[a-z]+s)|([A-Z]{2,})|([\d]+)|Football"
        var bad_places_regexp=new RegExp("\\s"+bad_places+"(\\s|[,\/\.]{1}|$|-)","i");
        var bad_stuff_regexp=new RegExp(my_query.short_name+",?(-[^\\s]*)?\\s([^\\s]+\\s){0,3}("+bad_places+
                                        ")(\\s|[,\/\.]{1}|$|-)","i");
        var bad_twitter_regexp=new RegExp(my_query.short_name+",?(-[^\\s]*)?\\s([^\\s]+\\s){0,3}("+bad_twitter_places+
                                        ")(\\s|[,\/\.]{1}|$|-)","i");
        var before_bads="Visit|Company|Larry";
        var before_bad_stuff_regexp=new RegExp("^("+before_bads+")\\s([^\\s]+\\s){0,3}"+my_query.short_name+"(\\s|,|$|-)","i");
        console.log("before_bad_stuff_regexp="+before_bad_stuff_regexp);
        if(/(\s)Recreation Division|Public Works(\s|,|-|$)/i.test(b_name)
          || (bad_stuff_regexp.test(b_name)) || before_bad_stuff_regexp.test(b_name)
           || (!name_regexp.test(b_name)&&bad_places_regexp.test(b_name)) ||
           (site==="twitter" && bad_twitter_regexp.test(b_name))
          )
        {
            let bad_match=b_name.match(bad_stuff_regexp);
            console.log("bad_match="+JSON.stringify(bad_match));
            if(!(bad_match && (bad_match[3].indexOf(my_query.state.toLowerCase())!==-1 ||
                              bad_match[3].indexOf(reverse_state_map[my_query.state].toLowerCase())!==-1)))
            {
                console.log("bad name");
                return true;
            }
        }
        var of_regex=new RegExp("^(.*) of "+my_query.short_name,"i");

        if(of_regex.test(orig_b_name))
        {
            var match=orig_b_name.match(of_regex);
            var type=my_query.orig_name.match(/^(.*)\sof\s/);
            var type_regex="";
            if(type) type_regex=new RegExp("^"+type[1],"i");
            console.log("type_regex="+type_regex);
            if(match && type && !type_regex.test(match[1]) && !((type[1]==="City" && match[1]==="Town")||(type[1]==="Town" && match[1]==="City")))
            {
                console.log("Bad match, "+type[1]+" not found at beginning of "+match[1]);
                return try_bad_name_again(orig_b_name,p_caption,site,pos);
            }
        }
        else if(site==="twitter" && b_name.indexOf(my_query.short_name.toLowerCase())!==0)
        {
            console.log("bad name type twitter");
            return true;
        }


        var p_caption_regexp=new RegExp("(\\s|,|^)(bank locations|Automotive)(\\s|,|$)","i");
        var p_caption_first=p_caption.split(/[!\.\?]+/)[0];

        if(site==="twitter") {
            if(!/country club/i.test(my_query.orig_name) && (/(country club)|(Protected Tweets )|((Cuisine|Baseball)(\s|\.|\,))|(Parody(\s|\.|$))/i.test(p_caption)
              ||/(Follow us for the latest news,)|(Get the latest news)/.test(p_caption))

              ) {
                console.log("Protected Tweets found");
                return true; }
            if(/[^A-Za-z\d\.\,\;\-\'\"\!\?\s\(\)\[\]\{\}_\*]+/.test(b_name))
            {
                console.log("Found weird character "+b_name.match(/[^A-Za-z\d\.\,\;\-\'\"\!\?]+/));
                return true;
            }
        }
        if(/NOT affiliated with/i.test(p_caption)) {
            console.log("Unaffiliated page");
            return true;
        }
       
       // if(site==="twitter") return is_bad_twitter_name(orig_b_name,p_caption,site,pos);

        return false;
    }
    function is_bad_twitter_name(orig_b_name,p_caption,site,pos) {
        orig_b_name=orig_b_name.replace(/\|.*$/,"").replace(/\(@[^\)]+\)/,"").replace(my_query.short_name,"").trim();
        orig_b_name=orig_b_name.replace(/(^|\s|,)Official($|\s|,)/i,"").trim()
        .replace(/(^|\s|,)of($|\s|,)/i,"").replace(/(^|\s|,)(City|Town|Borough|Township|Village|Municipality|County)($|\s|,)/i,"")
        .trim();
        orig_b_name=orig_b_name.replace(/[,\.\?!]+/,"").replace(my_query.state,"").replace(reverse_state_map[my_query.state],"")
        .trim();
        orig_b_name=orig_b_name.replace(/Police|Department|PD|Dept|Sheriff(?:'s)?|SO/g,"").replace(/Dep/,"").trim();
        console.log("orig_b_name="+orig_b_name);
        if(orig_b_name.length===0) return false;
        else if(/^[A-Z]+$/.test(orig_b_name)) return false;
        else {
            console.log("Twitter name="+orig_b_name);
            return false;
        }
    }

    function is_bad_site(site,b_url) {
       // console.log("in is_bad_site for "+b_url);
        if((site==="facebook" && (/\/(pages|public|groups|events|posts)\//.test(b_url) ||
                                /permalink\.php/.test(b_url) || /x\.facebook\.com/.test(b_url) || /reviews(\/|$)/.test(b_url)
                                || !/www\.facebook\.com/.test(b_url) || /public\?/.test(b_url) ||
                                  /\/story\.php/.test(b_url)
                                ) ) ||
          (site=="twitter" && (/\/status\//.test(b_url) || !/twitter\.com/.test(b_url)))
          )
        {
            console.log("bad url format");
            return true;
        }

        return false;
    }

    function get_bing_url(doc) {
        var b_context=doc.getElementById("b_context");
        var infocard,inner_a,i,cbtn;
        if(b_context)
        {
            infocard=b_context.getElementsByClassName("infoCardIcons");
            cbtn=b_context.getElementsByClassName("cbtn");
            if(infocard.length>0)
            {
                inner_a=infocard[0].getElementsByTagName("a");
                for(i=0; i < inner_a.length; i++)
                {
                    console.log("* inner_a["+i+"].href="+inner_a[i].href);
                    if(/Official site/.test(inner_a[i].innerText)) return inner_a[i].href;
                }
            }
            else if(cbtn.length>0)
            {
                for(i=0; i < cbtn.length; i++)
                {
                    console.log("* cbtn["+i+"].href="+cbtn[i].href);
                    if(/Website/.test(cbtn[i].innerText)) return cbtn[i].href;
                }
            }

        }
        return "";
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var site;
        if(/site%3A([^\.]+).com/.test(response.finalUrl)) site=response.finalUrl.match(/site%3A([^\.]+).com/)[1];
        else if(/twitter&first/.test(response.finalUrl)) site="twitter";
        else site="bing";

        console.log("in query_response for "+site+"\n"+response.finalUrl);

        var search, b_algo, i=0, inner_a;

	var b_url="", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,lgb_info;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            if(site==="bing")
            {
                b_url=get_bing_url(doc);
                if(b_url.length>0)
                {
                    resolve(b_url);
                    return;
                }
            }



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 5; i++)
            {
                if(site==="bing" && i>=0) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(site+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(i< 5 && !(site==="bing" && is_bad_url(b_url,bad_urls,-1)) &&
                             !is_bad_name(b_name,p_caption,site,i) && !is_bad_site(site,b_url)

                  )  {
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
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.try_count[site]===0)
        {
            my_query.try_count[site]++;
            var temp_name=my_query.agency_name.replace(/Consolidated Independent School District/,"CISD").replace(
                /Independent School District/,"ISD");
            query_search(temp_name+" "+site, resolve, reject, query_response);
            return;
        }
        else
        {
            resolve("");
            return;
        }

        //reject("Nothing found");
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

    /* Tests if the location is the right area for the city sought */
    function test_location(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");


        console.log("in test_location "+response.finalUrl);

        var search, b_algo, i=0, inner_a;

        var b_url="", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,lgb_info,mt_tleWrp,address;
        try
        {
            mt_tleWrp=doc.getElementById("mt_tleWrp");
            if(mt_tleWrp)
            {
                address=mt_tleWrp.getElementsByTagName("a")[0].innerText.replace(/, US$/,"");
                console.log("Found address="+address);
                var parsed=parseAddress.parseLocation(address);
                console.log("Parsed address="+JSON.stringify(parsed));
                if(parsed!==null && parsed.state!==undefined && parsed.city!==undefined)
                {
                    console.log("Parsed address="+JSON.stringify(parsed));

                    my_query.temp_fb_result.success=parsed.state.trim()===my_query.state.trim() && parsed.city.trim()===my_query.city.trim();
                    my_query.temp_fb_result.extra="Did Bing";
                     GM_setValue("fb_result",my_query.temp_fb_result);
                    return;
                }
            }
        }
        catch(error) { console.log("Error "+error);
                     my_query.temp_fb_result.success=false;
                     GM_setValue("fb_result",my_query.temp_fb_result);
                      return;

                     }
        my_query.temp_fb_result.success=false;
                     GM_setValue("fb_result",my_query.temp_fb_result);
                      return;
    }

    function test_promise_then(result) { }

    function submit_if_done() {
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var orig_fb=wT.rows[5].cells[1].innerText.trim().toLowerCase().replace(/m\.facebook\.com/,"www.facebook.com")
        .replace(/http:/,"https:")

        ,orig_twitter=wT.rows[10].cells[1].innerText.trim().toLowerCase();
        var curr_fb=document.getElementsByName("FB URL")[0], curr_twitter=document.getElementsByName("Twitter URL")[0];
        curr_fb.value=curr_fb.value.toLowerCase();
        curr_twitter.value=curr_twitter.value.toLowerCase();
        if(orig_fb.length===0) orig_fb="none";
        if(orig_twitter.length===0) orig_twitter="none";
        console.log("orig_fb="+orig_fb+", curr_fb="+curr_fb.value+"\norig_twitter="+orig_twitter+", curr_twitter="+curr_twitter.value);
        if(orig_fb.indexOf(curr_fb.value)!==-1 || curr_fb.value.indexOf(orig_fb)!==-1) {
            console.log("MATCH FB");
            curr_fb.style.backgroundColor="#ffffff"; }
        else if((orig_fb.split("/").length<4||
                (orig_fb.split("/")[3].split("-").length<3&&orig_fb.split("/")[3]!=="pages"))||curr_fb.value==="none") {
            console.log("orig_fb.indexOf(curr_fb.value)="+orig_fb.indexOf(curr_fb.value));
            curr_fb.style.backgroundColor="#ffff55"; }
        else
        {
            curr_fb.style.backgroundColor="#ffffff"; }
        if(orig_twitter.indexOf(curr_twitter.value)!==-1 || curr_twitter.value.indexOf(orig_twitter)!==-1 || curr_twitter.value===orig_twitter) {
            console.log("MATCH twitter");
            curr_twitter.style.backgroundColor="#ffffff"; }
        else {  console.log("orig_twitter.indexOf(curr_twitter.value)="+orig_twitter.indexOf(curr_twitter.value));

            curr_twitter.style.backgroundColor="#ffff55"; }

        console.log("(doneFB, doneTwitter,doneFBSearch,doneWebTwitter,submitted)=("+my_query.doneFB+","+my_query.doneTwitter+","+
                    my_query.doneWebFB+","+my_query.doneWebTwitter+","+my_query.submitted+")");
        if(my_query.doneFB && my_query.doneTwitter  && my_query.doneWebFB&& my_query.doneWebTwitter && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function);
        }
    }

    function fb_home_promise_then(result) {
        console.log("* fb_home_promise_then"+JSON.stringify(result));
        my_query.fb_home_result=result;
        if(my_query.fb_home_result && my_query.fb_posts_result)
        {
            check_good_fb();
        }

    }

    function fb_posts_promise_then(result) {
        console.log("* fb_posts_promise_then"+JSON.stringify(result));
        my_query.fb_posts_result=result;
        if(my_query.fb_home_result && my_query.fb_posts_result)
        {
            check_good_fb();
        }
    }

    function check_good_fb() {
        console.log("* in check_good_fb");
        var success=true;

        if(!(my_query.fb_home_result.success && my_query.fb_posts_result.success))
        {
            console.log("no success");
            success=false;
        }
        else
        {

            if(is_bad_fb_home())
            {
                console.log("Bad fb_home");
                success=false;
            }
            if(my_query.fb_home_result.addressInner!==undefined &&
               is_bad_fb_address(my_query.fb_home_result.addressInner.trim().replace(/\n/g,",").replace(/\s*\([^\)]+\)\s*/g,"")
                                 .replace(/\s*\d[A-Za-z]{1,2}\s*floor\s*/i," ").replace(/Ste\.? [\d]+/,"")
                                 .replace(/P(\.?)O(\.?) Box [\d\-]+,/,"123 Fake Street,")))
            {
                console.log("Bad fb_address");
                success=false;
            }
        }
        if(!success)
        {
            console.log("A bad FB page found");
            if(document.getElementsByName("FB URL")[0].value.length===0)
            {
                document.getElementsByName("FB URL")[0].value="none";
                document.getElementsByName("FB Likes")[0].value="none";
                document.getElementsByName("FB Followers")[0].value="none";
            }
        }
        else
        {
            document.getElementsByName("FB URL")[0].value=my_query.fb_home_result.fb_url;
            document.getElementsByName("FB Likes")[0].value=my_query.fb_home_result.likes;
            document.getElementsByName("FB Followers")[0].value=my_query.fb_home_result.followers;
            document.getElementsByName("Most_Recent_Activity")[0].value=my_query.fb_posts_result.date;
        }

        if(my_query.caller==="")
        {
            my_query.doneFB=true;

            if(!my_query.doneWebFB && my_query.webFB_url.length>0)
            {
                if(my_query.fb_home_result.fb_url.toLowerCase().replace(/\/$/,"")!==my_query.webFB_url.toLowerCase().replace(/\/$/,""))
                {
                    fb_promise_then(my_query.webFB_url,"website");
                    my_query.webFB_url="";
                }
                else
                {
                   // console.log("setting doneWebFB in caller");
                    my_query.doneWebFB=true;
                }

                submit_if_done();
                my_query.fb_home_result=null;
                my_query.fb_posts_result=null;
                return;
            }


        }
        else
        {
           // console.log("Setting doneWebFB for website in check_good_fb");
            my_query.doneWebFB=true;
        }
        my_query.fb_home_result=null;
        my_query.fb_posts_result=null;


        submit_if_done();
        return true;

    }

    function is_bad_fb_home() {
        let result=my_query.fb_home_result,k;
        if(result.phone!==undefined)
        {

            let num_only=result.phone.replace(/[^\d]+/g,"");
            console.log("num_only="+num_only);

            if(area_code_map[num_only.substr(0,3)]===undefined || state_map[area_code_map[num_only.substr(0,3)]]===undefined ||
               state_map[area_code_map[num_only.substr(0,3)]]!==my_query.state)
            {
                if(area_code_map[num_only.substr(0,3)]!==undefined)
                {
                    console.log("Wrong phone state, found "+state_map[area_code_map[num_only.substr(0,3)]]);
                    return true;
                }
            }
        }

        for(k=0; k < result.keywords.length; k++)
        {
            // console.log("inner_a.length="+inner_a.length);
            if(result.keywords[k].length>0)
            {
                console.log("result.keywords["+k+"]="+result.keywords[k]);
            }
            let keywords=result.keywords[k];
            if(/Government Organization|City Hall|Borough|(^City$)|Locality/.test(keywords) ||
              /Public &|Government|Town Hall|Public Service|(^Community$)|(^Community)|(^Landmark & Historical Place)/.test(keywords)
              ) {
                return false; }


//            console.log("this keyword not good");
        }
        console.log("No good keywords found");
        return true;


    }

    /* Following the finding the district stuff */
    function fb_promise_then(url,caller) {

        if(caller===undefined) caller="";
        if(caller==="") my_query.fb_url=url;
        my_query.caller=caller;
        console.log("fb_promise_then:caller="+caller);
        url=url.replace(/\/posts\/?.*$/,"").replace(/\?([^\/]+)$/,"");
        url=url.replace(/^https:\/\/www\.facebook\.com\/pg\/([^\/]+)\/about/,"https://www.facebook.com/$1");
        url=url.replace(/\/(about|videos|photos|info)\/?.*$/,"").replace(/timeline(\/)?$/,"");
        url=url.replace(/(m|business)\.facebook\.com/,"www.facebook.com").replace(/\.$/,"");

         console.log("fb:url="+url+", my_query.webFB_url="+my_query.webFB_url+"\tdoneWebFB="+my_query.doneWebFB);
        GM_setValue("fb_result","");
        if(url.length===0) // || (url.toLowerCase()===document.getElementsByName("FB URL")[0].value))
        {
            if(document.getElementsByName("FB URL")[0].value.length===0)
            {
                document.getElementsByName("FB URL")[0].value="none";
                document.getElementsByName("FB Likes")[0].value="none";
                document.getElementsByName("FB Followers")[0].value="none";
            }
            if(caller==="website") my_query.doneWebFB=true;
            else
            {
                my_query.doneFB=true;
                if(!my_query.doneWebFB && my_query.webFB_url.length>0)
                {
                    fb_promise_then(my_query.webFB_url,"website");
                    my_query.webFB_url="";
                    submit_if_done();
                    return;
                }
            }
            submit_if_done();
            return;

        }
        var promise1=MTurkScript.prototype.create_promise(url,MTurkScript.prototype.parse_FB_home,fb_home_promise_then,
                                                         function(response) { console.log("failed FB home");
                                                                             my_query.doneFBHome=true;
                                                                             submit_if_done(); });
        console.log("* posts_url="+(url.replace(/\/$/,"")+"/posts"));
        var promise2=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/posts",MTurkScript.prototype.parse_FB_posts,fb_posts_promise_then,
                                                         function(response) { console.log("failed FB posts "+response);
                                                                             my_query.doneFBPosts=true;
                                                                             submit_if_done(); });

    }
    function twitter_promise_then(url,caller) {
        console.log("twitter:url="+url);
        GM_setValue("twitter_result","");
        if(caller===undefined) caller="";

        if(url.length===0)
        {
            if(document.getElementsByName("Twitter URL")[0].value.length===0||caller==="website")
            {
                document.getElementsByName("Twitter URL")[0].value="none";
                document.getElementsByName("Twitter Followers")[0].value="none";
            }
            if(caller==="website") my_query.doneWebTwitter=true;
            else
            {
                my_query.doneTwitter=true;
                console.log("Trying again?");
                if(!my_query.doneWebTwitter && my_query.webTwitter_url.length>0)
                {
                                    console.log("Trying again!!!");

                    twitter_promise_then(my_query.webTwitter_url,"website");
                }
                else
                {
                    console.log("Not trying again "+my_query.doneWebTwitter+", "+my_query.webTwitter_url);

                    my_query.doneWebTwitter=true;
                }

            }
            submit_if_done();
            return;

        }
        GM_addValueChangeListener("twitter_result", function() {
            var result=arguments[2];
            console.log("url="+url+", twitter_result="+JSON.stringify(result));
            if(result==="")
            {
                result=arguments[1];
                console.log("arguments[2] not an object "+caller+", "+JSON.stringify(arguments));
                /*if(caller==="") my_query.doneTwitter=true;
                else my_query.doneWebTwitter=true;*/

                submit_if_done();
                return;
            }
            if((document.getElementsByName("Twitter URL")[0].value.length===0 ||caller==="website"))
            {
                document.getElementsByName("Twitter URL")[0].value=result.twitter_url;
                document.getElementsByName("Twitter Followers")[0].value=result.twitter_followers;
            }
            if(caller==="website")
            {
                my_query.doneWebTwitter=true;
                my_query.webTwitter_url="";
            }
            else
            {
                my_query.doneTwitter=true;
                if(caller==="" && !result.success && !my_query.doneWebTwitter && my_query.webTwitter_url.length>0)
                {
                    console.log("Result failed, trying original twitter");
                    twitter_promise_then(my_query.webTwitter_url,"website");
                    my_query.webTwitter_url="";
                }
                else my_query.doneWebTwitter=true;
            }
            submit_if_done();
            return;
        });
        GM_setValue("twitter_url",{url:url,website:caller==="website"});
    }

    function bing_promise_then(url) {
        console.log("bing: official url="+url);
        my_query.agency_url=url;
        GM_setValue("my_query",my_query);
        var search_str;
        console.log("my_query.query_name=("+my_query.query_name+")");
        var search_name=my_query.query_name.replace(/,\s*([^,]+)$/,function(match, p1, offset, string) {
            console.log("match="+JSON.stringify(p1)+", "+state_map[p1.trim()]);
            if(match && state_map[p1]!==undefined) return ", ("+p1+" OR "+state_map[p1]+")";
            else return match;
        });
        search_str=search_name+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for FB");
            query_search(search_str, resolve, reject, query_response);
        });

        fbPromise.then(fb_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });

        search_str=search_name
            +" site:twitter.com";

        const twitterPromise = new Promise((resolve, reject) => {
            console.log("Beginning Twitter search");
            query_search(search_str, resolve, reject, query_response);
        });
        twitterPromise.then(twitter_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        if(my_query.agency_url.length>0)
        {


        }
        else
        {
            
           submit_if_done();
        }
    }

    function parse_web(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,links=doc.links,foundWebTwitter=false,foundWebFB=false;
        for(i=0; i < links.length; i++)
        {


            if(/facebook\.com/.test(links[i].href) && !is_bad_site("facebook",links[i].href) && !foundWebFB)
            {
                console.log("WEB: found FB "+links[i].href);
                foundWebFB=true;
                my_query.webFB_url=links[i].href;
                if(my_query.doneFB)
                {
                    fb_promise_then(links[i].href,"website");
                }
            }

            else if(/twitter\.com/.test(links[i].href) && !is_bad_site("twitter",links[i].href) && !foundWebTwitter)
            {
                console.log("WEB: found Twitter "+links[i].href);
                foundWebTwitter=true;
                my_query.webTwitter_url=links[i].href;
                if(my_query.doneTwitter)
                {
                    twitter_promise_then(links[i].href,"website");
                }
            }
        }
        console.log("^ Here in parse_web");

        if(!foundWebFB) my_query.doneWebFB=true;
        if(!foundWebTwitter) my_query.doneWebTwitter=true;
        submit_if_done();


    }

  

    function is_bad_fb_address(add_text) {
       // var add_text=
         //           console.log("address.length="+address.length+", address="+add_text);
       
        add_text=add_text.replace(/,[^,]*County,/i,",").replace(/Suite [A-Z\-\d]+/i,"")
        .replace(/P(\.|\s)?O(\.|\s)? Box [\d\-]+,/i,"123 Fake Street,")
         console.log("address="+add_text);
        var parsedAdd=parseAddress.parseLocation(add_text);
         if(parsedAdd.sec_unit_type!==undefined) parsedAdd.city=parsedAdd.sec_unit_type+" "+parsedAdd.city;
        console.log("parsedAdd="+JSON.stringify(parsedAdd));

        if(parsedAdd.state===undefined)
        {
            var state_regex=/([^\n,]+), ([^\n,]+) ([\d]{5})$/;
            var my_match=add_text.trim().match(state_regex);
            if(my_match && (state_map[my_match[2]]!==undefined || reverse_state_map[my_match[2]]!==undefined))
            {
                parsedAdd.state=my_match[2];
            }
        }
        if(parsedAdd.state!==undefined && parsedAdd.state!==my_query.state && state_map[parsedAdd.state]!==my_query.state)
        {
            console.log("Bad address parsed="+parsedAdd.state+", my_query="+my_query.state);

            return true;
        }
        if(parsedAdd.city!==undefined)        parsedAdd.city=parsedAdd.city.toLowerCase();

        var query_city=my_query.city.toLowerCase();
        if(parsedAdd.city!==undefined)
        {
            parsedAdd.city=parsedAdd.city.replace(/Township|Twp\.?/i,"").replace(/\'/ig,"").trim();
            parsedAdd.city=parsedAdd.city.replace(/(^|\s)St\.?(^|\s|,)/i,"$1saint$2");
        }
        if(!/County/i.test(my_query.agency_name) && parsedAdd.city!==undefined && parsedAdd.city!==query_city.replace(/\'/g,"")
          && parsedAdd.city.replace(/mount\s/i,"mt ").replace(/Saint\s/i,"st ")!==query_city.replace(/\'/g,"")
           && parsedAdd.city!==my_query.short_name.toLowerCase() && parsedAdd.city.replace(/mount\s/i,"mt ").replace(/saint\s/i,"st ")!==
           my_query.short_name.toLowerCase()
          )
        {
            console.log("Bad address city parsed="+parsedAdd.city+", my_query="+my_query.city);
            return true;
        }
        return false;
    }

    function is_bad_twitter(bio,location) {
        if(document.getElementsByClassName("errorpage-body-content").length>0)
        {
            console.log("Error page");
            return true;
        }
        var url_elem=document.getElementsByClassName("ProfileHeaderCard-urlText");
        var url="";
        var loc_text=location.innerText;
        loc_text=loc_text.replace(/(Street|St\.)\s/,"$1, ").replace(/,\s*(US|USA)\s*$/,"");
        console.log("loc_text="+loc_text);
        var profilehead=document.getElementsByClassName("ProfileHeaderCard");
        console.log("profilehead.length="+profilehead.length);
        if(profilehead.length===0) return;
        if(url_elem.length>0 && url_elem[0].getElementsByTagName("a").length>0) url=url_elem[0].getElementsByTagName("a")[0].title;
        console.log("url="+url);
        if(bio===undefined || bio===null || bio.innerText===undefined) bio={innerText:""};
        var bio_split=bio.innerText.split(/[\.\!\?]+/,);
        var bio_text=bio.innerText;
        console.log("bio_split="+bio_split);
        var bad_bio_regex=/Country Club|Bookstore|Unofficial/i;
        var bad_first_regex=/Basketball|Baseball|Football|Casino/i;
        if((!bad_bio_regex.test(my_query.orig_name) && bad_bio_regex.test(bio_text)) ||
          (bio_split.length>0 && bad_first_regex.test(bio_split[0])))
        {
            console.log("Bad bio");
            return true;
        }
        var badges=document.getElementsByClassName("ProfileHeaderCard-badges");
        if(badges.length===0 || badges[0].getElementsByClassName("Icon--verified").length===0)
        {
            console.log("not verified");
            if(!/(^|\s|,)(the public|official|government)($|\s|,|\.)/i.test(bio.innerText)
             &&  !/gov/.test(url) && !/Twitter account for/.test(bio.innerText)

               && !(my_query.agency_url.length>0 && url.toLowerCase().indexOf(get_domain_only(my_query.agency_url,true))!==-1)

              ) {
                console.log("no official word");
                //return true;
            }
          //  return true;
        }
        var matches_other_state,x,begin_bio;
        var loc_split=loc_text.split(",");
        if(/England|Canada|UK/.test(loc_split[loc_split.length-1])) return true;
        if(/,/.test(loc_text))
        {

            var first_part=loc_text.split(",")[0].trim().replace(/\./g,"").trim();
                            //console.log("blomp");

            if(/(Road|(Rd(\.?))|Street|(St(\.?)))(\s|$)/.test(first_part))
            {
                loc_text=loc_text.replace(/^[^,]+,\s*/,"");
                //console.log("Found Street/road");
                first_part=loc_text.split(",")[0].trim().replace(/\./g,"").trim();
            }
            if(/ County/i.test(first_part))
            {
                if(first_part.toLowerCase()!==my_query.county.toLowerCase())
                {
                    console.log("Counties don't match. Found "+first_part+", need "+my_query.county);
                    return true;
                }
            }
            else if(first_part.toLowerCase().indexOf(my_query.city.toLowerCase().replace(/\./g,"").trim())===-1 &&
               my_query.city.toLowerCase().indexOf(first_part.toLowerCase())===-1 &&
               first_part.toLowerCase().indexOf(my_query.county.toLowerCase())===-1 &&
              first_part.toLowerCase().replace(/mount\s/,"mt ").replace(/saint\s/,"st ")
               .indexOf(my_query.city.toLowerCase().replace(/\./g,"").
                                               trim())===-1 && first_part.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1
              )
            {
                if(loc_split.length===2)
                {
                    console.log("Matched bad city1 "+first_part.toLowerCase()+", my_query="+my_query.city.toLowerCase());
                    return true;
                }
                else if(loc_split.length===3)
                {
                    if(loc_split[1].trim().toLowerCase().indexOf(my_query.city.toLowerCase())===-1 &&
                      my_query.city.toLowerCase().indexOf(loc_split[1].trim().toLowerCase())===-1)
                    {
                        console.log("Matched bad city2");
                        return true;
                    }
                }

            }
        }

        var state_part=loc_text;
        if(/,/.test(loc_text))
        {
            state_part=loc_text.split(",")[loc_text.split(",").length-1].replace(/\./g,"").trim();
        }
        for(x in state_map)
        {
          //  console.log("x="+x);
            if(state_map[x]===my_query.state) continue;
            let curr_regex=new RegExp("(,|\s|^)"+x);
            var reverse_regex=new RegExp(state_map[x]);
            if(curr_regex.test(state_part))
            {
                console.log("Matched bad state "+curr_regex);
                return true;
            }
            else if(reverse_regex.test(state_part))
            {
                console.log("matched reverse state on "+reverse_regex+", x="+x+", my_query.state="+my_query.state);
                return true;
            }
        }
        if(bio_split.length===0) return false;
        begin_bio=bio_split[0]
        var city_state_reg=new RegExp(my_query.city+",?\\s*([A-Z]{2})"),city_state_match;
        console.log("city_state_reg="+city_state_reg);
        city_state_match=bio_text.match(city_state_reg);
        if(city_state_match && city_state_match[1]!==my_query.state && reverse_state_map[city_state_match[1]]!==undefined)
        {
            console.log("Wrong state "+JSON.stringify(city_state_match));
            return true;
        }

        return false;

    }

    /* Do twitter parsing */
    function do_twitter() {
        var result={success:true,twitter_url:"none",twitter_followers:"none"};
        console.log("Doing twitter");
        var name=document.getElementsByClassName("ProfileHeaderCard-name");
        var bio=document.getElementsByClassName("ProfileHeaderCard-bio")[0];
        var location=document.getElementsByClassName("ProfileHeaderCard-locationText")[0];
        if(window.location.href.indexOf("https://twitter.com/i/cards")!==-1) { return; }
        var i,navstat;
      /*  if(name.length>0 && /^City of/i.test(name[0].innerText)) {
            console.log("Wrong type of site");
            return true;
        }*/

        if(is_bad_twitter(bio, location))
        {
            console.log("Bad twitter");
            result.success=false;
            console.log("result="+JSON.stringify(result));
            GM_setValue("twitter_result",result);
            return;
        }
        result.twitter_url=window.location.href;
        navstat=document.getElementsByClassName("ProfileNav-stat");
        for(i=0; i < navstat.length; i++)
        {
            if(navstat[i].dataset.nav!==undefined && navstat[i].dataset.nav==="followers")
            {
                result.twitter_followers=navstat[i].getElementsByClassName("ProfileNav-value")[0].dataset.count;
                break;
            }
        }
        GM_setValue("twitter_result",result);

    }

    function fb_search_promise_then(result) {
        console.log("result="+JSON.stringify(result));
        var i;
        for(i=0; i < result.sites.length && i < 6; i++)
        {
            result.sites[i].url=result.sites[i].url.replace(/\/\?ref\=br_rs$/,"");
            console.log("("+i+"), name="+result.sites[i].name+", url="+result.sites[i].url);
            if(!is_bad_site("facebook",result.sites[i].url) && !is_bad_name(result.sites[i].name,"","facebook",0))
            {
                console.log("Success");
                if(!my_query.doneFB)
                {

                    if(my_query.fb_url.length===0 ||
                       result.sites[i].url.toLowerCase().replace(/\/$/,"")!==my_query.fb_url.toLowerCase().replace(/\/$/,""))
                    {
                        my_query.webFB_url=result.sites[i].url;
                        console.log("Setting webFB_url in fb_search_promise_then to "+my_query.webFB_url);
                        return;
                    }
                    else
                    {
                        console.log("Setting webFB=true in fb_search_promise_then");
                        my_query.doneWebFB=true;
                        submit_if_done();

                        return;
                    }
                }
                else
                {
                    console.log("#### Oops FB already Finished");

                    my_query.webFB_url=result.sites[i].url;
                    fb_promise_then(my_query.webFB_url,"website",result.sites[i].text);
                    return;


                }
            }
        }
        if(/\d+,/.test(my_query.query_name) || (/\s(Elementary )?(School )?District/.test(my_query.query_name)) ||
          /(^|\s)((?:Independent|Public|High|Community Consolidated) School District|Public Schools)(\s|,|$)/.test(my_query.query_name)

          )
        {

            my_query.query_name=my_query.query_name.replace(/\d+,/g,",")
            .replace(/(^|\s)((?:Independent|Public|High|Community Consolidated) School District|Public Schools)(\s|,|$)/,"$1Schools$3")

            .replace(/\s(Elementary )?(School )?District/," Schools");

            var fb_url="https://www.facebook.com/search/pages/?q="+encodeURIComponent(my_query.query_name);
             console.log("Trying again with new query name\nfb_search_url:"+fb_url);
            var promise=MTurkScript.prototype.create_promise(fb_url,MTurkScript.prototype.parse_FB_search_page,fb_search_promise_then,
                                                         function(response) { console.log("failed FB search"); submit_if_done(); });
            return;
        }


        my_query.doneWebFB=true;
        submit_if_done();


    }

    function replace_roman(match,p1,p2,p3) {
        var i;
        var count=0,temp1=0,temp2=0;
        var num_map={"I":1,"V":5,"X":10};
        for(i=0; i < p2.length; i++)
        {
            if(num_map[p2.substr(i,1)]!==undefined)
            {
                temp1=num_map[p2.substr(i,1)];
                temp2=count%temp1;
                count=count-(2*temp2)+temp1;
            }
        }
        return p1+"R-"+count+p3;
    }

    function init_Query()
    {
        console.time("begin");
        var k;
        var ctrl=document.getElementsByClassName("form-control");
        var pbody=document.getElementsByClassName("panel-body")[0];
        pbody.parentNode.removeChild(pbody);
        for(k=0; k < ctrl.length; k++)
        {
            ctrl[k].parentNode.className="col-md-12";
        }
     //   var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];

        wT.rows[5].cells[1].innerHTML=wT.rows[5].cells[1].innerText.trim().toLowerCase()
            .replace(/^facebook\.com/,"https://www.facebook.com").replace(/^http:/,"https:")
            .replace(/https:\/\/facebook/,"https://www.facebook");
        wT.rows[10].cells[1].innerHTML=wT.rows[10].cells[1].innerText.trim().toLowerCase()
        .replace(/\.com\/@/,".com")
            .replace(/^twitter\.com/,"https://twitter.com").replace(/^http:/,"https:").replace(/^https:\/\/www\./,"https://");
         var orig_twitter=wT.rows[10].cells[1].innerText.trim().toLowerCase();
        var agency_match;
        my_query={agency_name:wT.rows[0].cells[1].innerText.trim(),query_name:"", city:wT.rows[1].cells[1].innerText.trim(),
                  county: wT.rows[2].cells[1].innerText.replace(/,.*$/,"").replace(/City and County of/,"").trim(),
                 state: wT.rows[3].cells[1].innerText.trim().toUpperCase(),submitted:false,doneFB:false,doneTwitter:false,doneWebFB:false,
                  doneFBSearch:false,
                  doneWebTwitter:false,webTwitter_url:orig_twitter,webFB_url:"",agency_type:"",agency_number:"",
                  fb_url:"",fb_home_result:null,fb_posts_result:null,fb_caller:null,
                 try_count:{"twitter":0,"facebook":0},orig_name:wT.rows[0].cells[1].innerText.trim(),
                 tot_attempts:GM_getValue("attempts",0),tot_time:GM_getValue("time",0),begin_time:new Date().getTime() };

        my_query.city=my_query.city.replace(/No\.\s/,"North ")
        .replace(/^([A-Z]{1})(.*)$/,function(match,p1,p2) {

            console.log("match="+match+", p1="+p1+", p2="+p2);
            return p1+p2.toLowerCase(); });


        my_query.orig_name=my_query.orig_name.replace(/Township of ([^,]*)/,"$1 Township").replace(/charter Township/,"Township");
        my_query.agency_name=my_query.orig_name.replace(/\([^\)]+\)/,"").trim().replace(/[A-Z]{2}$/,function(match, offset, string) {
            if(reverse_state_map[match]!==undefined) return reverse_state_map[match];
            else return match;
        });
        my_query.query_name=my_query.orig_name.replace(/\sCO\)/," County").replace(/[\(\)]+/g,"")
            .trim().replace(/[A-Z]{2}$/,function(match, offset, string) {
            if(reverse_state_map[match]!==undefined) return reverse_state_map[match];
            else return match;
        });


        console.log("New my_query.agency_name="+my_query.agency_name);
        agency_match=my_query.agency_name.match(/(.*)\s-\s*([^,]*),\s*(.*)$/);
        if(agency_match) my_query.agency_type=agency_match[2].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");
        else
        {
            agency_match=my_query.agency_name.match(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/);
            if(agency_match) my_query.agency_type=agency_match[3].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");
        }
        my_query.query_name=my_query.query_name.replace(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/,"$1 $3 $2");
        my_query.query_name=my_query.query_name.replace(/(^|\s)(?:Community|Central )School Corporation(\s|,|$)/,"$1Schools$2").trim();
        my_query.query_name=my_query.query_name.replace(/(^|\s)[\dR]+-([XVI\d]+)(\s|$|,)/,"")
        .replace(/School District[^,]*,/,"School District,")
        .replace(/Charter Township,/,"Township,");
        my_query.query_name=my_query.query_name.replace(/(^|\s)Union Free(\s|$)/," ").trim();

        console.log("my_query.query_name="+my_query.query_name);

        my_query.agency_name=my_query.agency_name.replace(/(.*)\s-\s([^,]*),\s*(.*)$/,"$1, $3 $2");
        my_query.agency_name=my_query.agency_name.replace(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/,"$1, $2 $3");
        my_query.agency_name=my_query.agency_name.replace(/(^|\s)(City|Town|Village|Borough)(\sof)(\s|$)/i," ")
        .replace(/Charter Township,/,"Township,");
        console.log("New my_query.agency_name="+my_query.agency_name);

        my_query.short_name=my_query.agency_name.replace(/,.*$/,"")

         my_query.short_name=my_query.short_name.replace(/Marshal(?:\'?s)(\s|$)(Office(\s|$))?/,"");
        my_query.short_name=my_query.short_name.replace(/\s*Township/,"");
        my_query.short_name=my_query.short_name.replace(/\s(Supervisory )?Union($|,)/,"");
        my_query.short_name=my_query.short_name.replace(/(((Area )?Public|Community|Consolidated) )?Schools$/,"");
        my_query.short_name=my_query.short_name.replace(/(?:(?:Union(?: Elementary))|Regional) School District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1");
        my_query.short_name=my_query.short_name.replace(/(?:(?:Union Free|Exempted Village|Unified|Local|Consolidated Independent|Independent|Community Unit|Community Consolidated|Central|County|Joint|Community|Public|Metropolitan|Reorganized|Elementary|City|High|(?:Community(?: High)?)) )?School District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1")

            .replace(/(?:(?:Unified|Regional|Independent|Central|County|Public|Metropolitan|Reorganized|Elementary|High(?:Community(?: High)?)) )?District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1")
.replace(/(\s)K-12/,"$1")
            .trim();
        my_query.short_name=my_query.short_name.replace(/Charter( Elementary)? School/i,"");
         my_query.short_name=my_query.short_name.replace(/((Public|Community) )?Schools$/,"");
        my_query.short_name=my_query.short_name.replace(/(^|\s)[R\d]{1}-[-A-Z\d]+(\s|$)/," ")
        .replace(/(^|\s)(City|Town|Village|County|Municipality|Township|Borough|(?:State )?University|Community College|College)(\sof)?(\s|$)/ig," ");
        my_query.short_name=my_query.short_name.replace(/(?: Community) School Corporation(\s|$)/,"$1");
        my_query.short_name=my_query.short_name.replace(/\sSchool System$/,"");

        my_query.short_name=my_query.short_name.trim();


        my_query.short_name=my_query.short_name.replace(/(^|\s)\([^\)]+\)(\s|$)/,"");
         my_query.short_name=my_query.short_name.trim();
        // Should never happen now
        if(/ - /.test(my_query.agency_name)) {
            console.log("Agency contains -, returning");

            GM_setValue("returnHit",true); return; }

       // my_query.query_name=my_query.query_name.replace(/(^|\s)(City|Town|Village|County|Municipality|(?:(Charter )?Township)|Borough)(\sof)?(\s|$)/i," ");
       // .replace(/(^|\s)of(\s|$)/i,"");
        console.log("my_query="+JSON.stringify(my_query));
        my_query.agency_type=my_query.agency_type.replace(/Sherrif/,"Sheriff");


        var search_str=my_query.agency_name;
        const bingPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for bing");
            query_search(search_str, resolve, reject, query_response);
        });

        bingPromise.then(bing_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this bingPromise " + val); GM_setValue("returnHit",true); });

        var fb_url="https://www.facebook.com/search/pages/?q="+encodeURIComponent(my_query.query_name);
        console.log("fb_search_url="+fb_url);
        var promise=MTurkScript.prototype.create_promise(fb_url,MTurkScript.prototype.parse_FB_search_page,fb_search_promise_then,
                                                         function(response) { console.log("failed FB search"); submit_if_done(); });
        document.getElementsByName("FB URL")[0].addEventListener('change',function() { submit_if_done(); });
        document.getElementsByName("Twitter URL")[0].addEventListener('change',function() { submit_if_done(); });



    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
     else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url",{url:"https://www.facebook.com",website:false});
        console.log("Doing facebook");
        my_query=GM_getValue("my_query");

        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url").url;
            console.log("url="+url);
            window.location.href=url;
        });
       // setTimeout(do_fb,2500);
    }
    else if(window.location.href.indexOf("twitter.com")!==-1)
    {
        GM_setValue("twitter_url",{url:"https://www.twitter.com",website:false});
        console.log("Doing twitter");
        my_query=GM_getValue("my_query");

        GM_addValueChangeListener("twitter_url",function() {
            console.log("twitter_url="+JSON.stringify(arguments[2]));
            window.location.href=arguments[2].url;
        });
        setTimeout(do_twitter,2500);
    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            /*setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 40000);*/
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */


        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();
