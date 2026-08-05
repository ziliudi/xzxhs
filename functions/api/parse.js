export async function onRequest(context) {

  const url =
  new URL(context.request.url)
  .searchParams
  .get("url");


  if(!url){

    return Response.json({
      error:"no url"
    });

  }


  let realUrl=url;


  if(url.includes("xhslink.cn")){


    const r =
    await fetch(url,{
      redirect:"manual",
      headers:{
        "User-Agent":"Mozilla/5.0 Android"
      }
    });


    realUrl =
    r.headers.get("location");

  }



  const res =
  await fetch(realUrl,{
    headers:{
      "User-Agent":
      "Mozilla/5.0 Chrome/120"
    }
  });


  const html =
  await res.text();



  const index =
  html.indexOf(
    "noteDetailMap"
  );



  return Response.json({

    length:html.length,

    index:index,


    before:
    html.substring(
      index-500,
      index
    ),


    after:
    html.substring(
      index,
      index+2000
    )

  });


}
