export async function onRequest(context) {
  const url = new URL(context.request.url);

  const shareUrl = url.searchParams.get("url");

  if (!shareUrl) {
    return Response.json({
      error: "缺少小红书分享链接",
      example: "/api/parse?url=https://xhslink.cn/xxx"
    });
  }

  try {

    // 第一步：解析短链接302
    const redirect = await fetch(shareUrl, {
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 12)"
      }
    });

    const location = redirect.headers.get("location");

    if (!location) {
      throw new Error("无法解析短链接");
    }


    // 第二步：获取真实笔记页面

    const htmlRes = await fetch(location, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
      }
    });


    const html = await htmlRes.text();


    // 第三步：提取 __INITIAL_STATE__

    const match = html.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{.*?\});<\/script>/s
    );


    if (!match) {

      return Response.json({
        error: "未找到INITIAL_STATE",
        page: location
      });

    }


    let state;

    try {

      state = JSON.parse(match[1]);

    } catch(e){

      throw new Error(
        "JSON解析失败"
      );

    }



    // 第四步：递归寻找 imageList

    let images = [];


    function findImages(obj){

      if(!obj || typeof obj !== "object")
        return;


      if(Array.isArray(obj)){

        obj.forEach(findImages);

        return;
      }


      if(
        obj.imageList &&
        Array.isArray(obj.imageList)
      ){

        images = obj.imageList;

      }


      Object.values(obj)
        .forEach(findImages);

    }


    findImages(state);



    if(!images.length){

      return Response.json({
        error:"没有找到图片",
        page:location
      });

    }



    const result = images.map(item=>{

      let id =
        item.urlDefault ||
        item.url_default ||
        item.fileId;


      if(
        id &&
        id.startsWith("//")
      ){

        id="https:"+id;

      }


      if(
        item.fileId &&
        !item.fileId.startsWith("http")
      ){

        id =
        "https://ci.xiaohongshu.com/"
        +
        item.fileId
        +
        "?imageView2/format/jpg";

      }


      return id;

    });



    return Response.json({

      success:true,

      page:location,

      count:result.length,

      images:result

    });


  } catch(err){

    return Response.json({

      error:err.message

    },{
      status:500
    });

  }

}
