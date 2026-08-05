export async function onRequest(context) {


  const reqUrl =
  new URL(context.request.url);


  let input =
  reqUrl.searchParams.get("url");


  if(!input){

    return Response.json({
      error:"请输入小红书链接"
    });

  }



  try{


    // 提取链接

    const match =
    input.match(
      /https?:\/\/[^\s]+/
    );


    if(match){

      input=match[0];

    }



    // 提取参数


    const url =
    new URL(input);



    let noteId="";


    const path =
    url.pathname;



    const parts =
    path.split("/");


    for(
      let i=0;
      i<parts.length;
      i++
    ){

      if(
        parts[i]=="explore" ||
        parts[i]=="discovery" ||
        parts[i]=="item"
      ){

        noteId=parts[i+1];

      }

    }



    const token =
    url.searchParams.get(
      "xsec_token"
    );


    const source =
    url.searchParams.get(
      "xsec_source"
    );




    if(!noteId){

      return Response.json({

        error:"没有找到note_id"

      });

    }





    // 尝试接口

    const api =
    "https://www.xiaohongshu.com/api/sns/web/v1/feed";


    const body =
    JSON.stringify({

      source_note_id:
      noteId,

      image_formats:[
        "jpg",
        "webp",
        "avif"
      ],

      extra:{
        need_body:true
      }

    });



    const response =
    await fetch(api,{

      method:"POST",

      headers:{


        "Content-Type":
        "application/json",


        "User-Agent":
        "Mozilla/5.0",


        "Referer":
        "https://www.xiaohongshu.com/",


        "x-s":
        "",


      },


      body

    });



    const text =
    await response.text();



    return Response.json({

      noteId,

      token,

      source,

      status:
      response.status,


      length:
      text.length,


      result:
      text.substring(
        0,
        1000
      )

    });



  }catch(e){


    return Response.json({

      error:
      e.message

    });


  }


}
