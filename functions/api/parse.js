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
    // 1. 从复制文本中提取URL
    // =========================


    const urlMatch =
      input.match(
        /https?:\/\/[^\s]+/
      );


    if(urlMatch){

      input = urlMatch[0];

    }



    let realUrl=input;



    // =========================
    // 2. 处理短链接
    // =========================


    if(
      input.includes("xhslink.cn")
    ){


      const r =
      await fetch(input,{

        redirect:"manual",

        headers:{

          "User-Agent":
          "Mozilla/5.0 (Android)"

        }

      });



      const location =
      r.headers.get("location");



      if(!location){

        throw new Error(
          "短链接跳转失败"
        );

      }


      realUrl=location;


    }



    // =========================
    // 3. 获取页面HTML
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




    // =========================
    // 4. 提取INITIAL_STATE
    // =========================


    function extractState(text){


      const key =
      "window.__INITIAL_STATE__=";


      let start =
      text.indexOf(key);



      if(start<0){

        return null;

      }



      start += key.length;



      while(
        text[start]===" " ||
        text[start]==="\n"
      ){

        start++;

      }



      if(
        text[start]!=="{"
      ){

        return null;

      }




      let count=0;

      let begin=start;

      let quote=false;

      let escape=false;



      for(
        let i=start;
        i<text.length;
        i++
      ){


        let c=text[i];



        if(
          escape
        ){

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



        if(
          c==='"'
        ){

          quote=!quote;

        }



        if(!quote){


          if(c==="{"){

            count++;

          }


          if(c==="}"){

            count--;


            if(count===0){

              return text.slice(
                begin,
                i+1
              );

            }

          }


        }


      }


      return null;

    }




    const jsonText =
    extractState(html);



    if(!jsonText){


      return Response.json({

        error:
        "没有找到INITIAL_STATE",

        page:realUrl

      });


    }




    let state;


    try{


      state =
      JSON.parse(jsonText);


    }catch(e){


      return Response.json({

        error:
        "JSON解析失败",

        detail:e.message

      });


    }




    // =========================
    // 5. 搜索图片列表
    // =========================


    let images=[];



    function findImages(obj){


      if(
        !obj ||
        typeof obj!=="object"
      ){

        return;

      }



      if(
        Array.isArray(obj.imageList)
      ){

        images=obj.imageList;

      }



      if(
        Array.isArray(obj)
      ){

        obj.forEach(findImages);

      }
      else{


        Object.values(obj)
        .forEach(findImages);


      }


    }



    findImages(state);




    if(
      !images.length
    ){


      return Response.json({

        error:
        "没有找到图片",

        page:realUrl

      });


    }




    // =========================
    // 6. 输出图片地址
    // =========================


    let result =
    images.map(item=>{


      if(
        item.urlDefault
      ){

        let u=item.urlDefault;


        if(
          u.startsWith("//")
        ){

          u="https:"+u;

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
