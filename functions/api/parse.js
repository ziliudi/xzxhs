export async function onRequest(context) {

  const requestUrl = new URL(context.request.url);

  const shareUrl =
    requestUrl.searchParams.get("url");


  if (!shareUrl) {

    return Response.json({
      error: "请输入小红书分享链接"
    });

  }



  try {


    // 1. 解析短链接

    const shortResponse =
      await fetch(shareUrl, {

        redirect:"manual",

        headers:{
          "User-Agent":
          "Mozilla/5.0 (Linux; Android 12)"
        }

      });



    const realUrl =
      shortResponse.headers.get("location");



    if(!realUrl){

      throw new Error(
        "短链接解析失败"
      );

    }



    // 2. 获取笔记页面HTML

    const pageResponse =
      await fetch(realUrl,{

        headers:{
          "User-Agent":
          "Mozilla/5.0 Chrome/120 Safari/537.36"
        }

      });



    const html =
      await pageResponse.text();



    // 3. 提取 INITIAL_STATE

    let jsonText = null;



    const patterns=[

      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,

      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})<\/script>/,

    ];



    for(
      const reg of patterns
    ){

      const m =
        html.match(reg);

      if(m){

        jsonText=m[1];

        break;

      }

    }



    if(!jsonText){


      return Response.json({

        error:
        "页面中没有找到笔记数据",

        page:
        realUrl

      });


    }



    // 清理HTML转义

    jsonText =
      jsonText
      .replace(/&quot;/g,'"')
      .replace(/&amp;/g,'&');



    let state;


    try{

      state =
      JSON.parse(jsonText);

    }catch(e){


      throw new Error(
        "JSON解析失败"
      );


    }




    // 4. 搜索imageList


    let images=[];



    function scan(obj){


      if(!obj ||
        typeof obj!=="object")
        return;



      if(Array.isArray(obj)){


        for(
          const item of obj
        ){

          scan(item);

        }


        return;

      }



      if(
        Array.isArray(obj.imageList)
      ){

        images =
        obj.imageList;

      }



      for(
        const key in obj
      ){

        scan(obj[key]);

      }


    }



    scan(state);




    if(!images.length){


      return Response.json({

        error:
        "没有找到图片列表",

        page:
        realUrl

      });


    }




    // 5. 转换图片地址


    const result =
    images.map(item=>{


      let url =
      item.urlDefault ||
      item.url_default ||
      "";



      if(
        url.startsWith("//")
      ){

        url =
        "https:"+url;

      }



      if(
        !url &&
        item.fileId
      ){

        url =
        "https://ci.xiaohongshu.com/"
        +
        item.fileId
        +
        "?imageView2/format/jpg";

      }



      return url;


    })
    .filter(Boolean);




    return Response.json({

      success:true,

      noteUrl:
      realUrl,

      count:
      result.length,

      images:
      result


    });



  }catch(err){



    return Response.json({

      success:false,

      error:
      err.message


    },{
      status:500
    });



  }


}
