export async function onRequest(context) {

  const requestUrl = new URL(context.request.url);

  let input =
    requestUrl.searchParams.get("url");


  if (!input) {

    return Response.json({
      error:"请输入小红书链接"
    });

  }


  try {


    // =========================
    // 提取文本中的URL
    // =========================

    const match =
      input.match(/https?:\/\/[^\s]+/);


    if(match){

      input = match[0];

    }



    let realUrl = input;



    // =========================
    // 短链接跳转
    // =========================

    if(
      input.includes("xhslink.cn")
    ){

      const r =
      await fetch(input,{
        redirect:"manual",
        headers:{
          "User-Agent":
          "Mozilla/5.0 Android"
        }
      });


      const location =
      r.headers.get("location");


      if(!location){

        throw new Error(
          "短链接没有跳转地址"
        );

      }


      realUrl = location;

    }




    // =========================
    // 获取页面
    // =========================


    const page =
    await fetch(realUrl,{
      headers:{
        "User-Agent":
        "Mozilla/5.0 Chrome/120 Safari/537.36"
      }
    });


    const html =
    await page.text();
    
    return Response.json({

  length: html.length,

  hasState: html.includes("window.__INITIAL_STATE__"),

  sample: html.substring(0,500)

});




    // =========================
    // 提取 INITIAL_STATE
    // =========================


    function extract(text){


      const key =
      "window.__INITIAL_STATE__";


      const pos =
      text.indexOf(key);


      if(pos<0){

        return null;

      }



      let start =
      text.indexOf(
        "{",
        pos
      );


      if(start<0){

        return null;

      }



      let count=0;

      let quote=false;

      let escape=false;



      for(
        let i=start;
        i<text.length;
        i++
      ){

        let c=text[i];


        if(escape){

          escape=false;
          continue;

        }


        if(
          c==="\\"
          &&
          quote
        ){

          escape=true;
          continue;

        }


        if(c==='"'){

          quote=!quote;

        }



        if(!quote){

          if(c==="{"){

            count++;

          }


          if(c==="}"){

            count--;


            if(count===0){

              return text.substring(
                start,
                i+1
              );

            }

          }

        }

      }


      return null;

    }




    const raw =
    extract(html);



    if(!raw){


      return Response.json({

        error:
        "找不到页面数据",

        page:
        realUrl

      });

    }





    // =========================
    // 解析对象
    // =========================


    let state=null;


    try{


      state =
      JSON.parse(raw);


    }catch(e){



      try{


        let fixed =
        raw
        .replace(
          /\bundefined\b/g,
          "null"
        )
        .replace(
          /\bNaN\b/g,
          "null"
        );



        state =
        Function(
          "return ("+
          fixed+
          ")"
        )();



      }catch(e2){


        return Response.json({

          error:
          "数据解析失败",

          detail:
          e2.message,

          sample:
          raw.substring(0,300)

        });


      }

    }





    // =========================
    // 搜索图片
    // =========================


    let images=[];



    function scan(obj){


      if(
        !obj ||
        typeof obj!=="object"
      ){

        return;

      }



      if(
        Array.isArray(obj.imageList)
      ){

        images =
        obj.imageList;

      }



      if(
        Array.isArray(obj)
      ){

        obj.forEach(scan);

      }else{


        Object.values(obj)
        .forEach(scan);

      }


    }



    scan(state);




    if(!images.length){


      return Response.json({

        error:
        "没有找到imageList",

        page:
        realUrl

      });


    }




    // =========================
    // 输出图片
    // =========================


    const result =
    images.map(item=>{


      if(
        item.urlDefault
      ){

        let u =
        item.urlDefault;


        if(
          u.startsWith("//")
        ){

          u =
          "https:"+u;

        }


        return u;

      }



      if(
        item.fileId
      ){

        return (
          "https://ci.xiaohongshu.com/"
          +
          item.fileId
          +
          "?imageView2/format/jpg"
        );

      }



      return null;


    })
    .filter(Boolean);




    return Response.json({

      success:true,

      count:
      result.length,

      note:
      realUrl,

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
