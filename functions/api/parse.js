export async function onRequest(context) {

  const requestUrl =
    new URL(context.request.url);


  let input =
    requestUrl.searchParams.get("url");


  if(!input){

    return Response.json({
      error:"请输入链接"
    });

  }



  try{


    // 提取文本中的URL

    const match =
      input.match(
        /https?:\/\/[^\s]+/
      );


    if(match){

      input=match[0];

    }



    let realUrl=input;



    // 处理短链接

    if(
      input.includes("xhslink.cn")
    ){

      const res =
      await fetch(input,{

        redirect:"manual",

        headers:{
          "User-Agent":
          "Mozilla/5.0 Android"
        }

      });


      const location =
      res.headers.get("location");


      if(!location){

        throw new Error(
          "短链接跳转失败"
        );

      }


      realUrl=location;

    }




    // 请求小红书页面


    const page =
    await fetch(realUrl,{

      headers:{

        "User-Agent":
        "Mozilla/5.0 Chrome/120 Safari/537.36"

      }

    });



    const html =
    await page.text();





    // 返回诊断信息

    const imageIndex =
      html.indexOf("imageList");


    const urlIndex =
      html.indexOf("urlDefault");


    const noteIndex =
      html.indexOf("noteDetailMap");



    let sample="";


    if(imageIndex>0){

      sample =
      html.substring(
        imageIndex-300,
        imageIndex+1000
      );

    }



    return Response.json({

      success:true,

      page:realUrl,


      length:
      html.length,


      hasState:
      html.includes(
        "window.__INITIAL_STATE__"
      ),


      imageIndex,

      urlIndex,

      noteIndex,


      sample


    });



  }catch(e){


    return Response.json({

      success:false,

      error:e.message

    });


  }


}
