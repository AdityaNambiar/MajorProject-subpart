module.exports = function processEvidences(event) {
  let docCount = 0,
    cCount = 0,
    cppCount = 0,
    javaCount = 0,
    jsCount = 0,
    cssCount = 0,
    htmlCount = 0,
    rCount = 0,
    pyCount = 0,
    excelCount = 0,
    pptCount = 0,
    psdCount = 0,
    imgCount = 0,
    audioCount = 0,
    pdfCount = 0,
    otherCount = 0;
  let input = event.target.files;
  var labels = [];
  for (var i = 0; i < input.length; ++i) {
    let ext = input[i]["name"].split(".").pop().toLowerCase();
    let name = input[i]["name"];
    let extlen = ext.length;
    let nlen = name.length;
    name = name.substr(0, nlen - extlen - 1);

    if (ext === "docx" || ext === "doc") {
      docCount = docCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "word.png",
        bg: "#d4e3f4",
        format: "DOCX",
      };
    } else if (ext === "c" || ext === "c#") {
      cCount = cCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "c.png",
        bg: "#ffe1db",
        format: "C",
      };
    } else if (ext === "c" || ext === "c#") {
      cppCount = cppCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "cpp.png",
        bg: "#ffe1db",
        format: "CPP",
      };
    } else if (ext === "java") {
      javaCount = javaCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "java.png",
        bg: "#ffe1db",
        format: "java",
      };
    } else if (ext === "js") {
      jsCount = jsCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "js.png",
        bg: "#ffe1db",
        format: "js",
      };
    } else if (ext === "css") {
      cssCount = cssCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "css.png",
        bg: "#ffe1db",
        format: "css",
      };
    } else if (ext === "html") {
      htmlCount = htmlCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "html.png",
        bg: "#ffe1db",
        format: "html",
      };
    } else if (ext === "r") {
      rCount = rCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "r.png",
        bg: "#ffe1db",
        format: "r",
      };
    } else if (ext === "py") {
      pyCount = pyCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "py.png",
        bg: "#ffe1db",
        format: "py",
      };
    } else if (ext === "xslx" || ext === "csv") {
      excelCount = excelCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "excel.png",
        bg: "#ffe1db",
        format: "excel",
      };
    } else if (ext === "pptx" || ext === "ppt") {
      pptCount = pptCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "ppt.png",
        bg: "#ffe1db",
        format: "PPT",
      };
    } else if (ext === "psd" || ext === "pdd") {
      psdCount = psdCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "photoshop.png",
        bg: "#d3d5e9",
        format: "PSD",
      };
    } else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
      imgCount = imgCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "image.png",
        bg: "#d8f0f7",
        format: "Picture",
      };
    } else if (ext === "mp4" || ext === "mkv" || ext === "avi") {
      audioCount = audioCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "video.png",
        bg: "#e2d8fb",
        format: "Video",
      };
    } else if (ext === "pdf") {
      pdfCount = pdfCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "pdf.png",
        bg: "#d3d5e9",
        format: "PDF",
      };
    } else {
      otherCount = otherCount + 1;
      labels[i] = {
        id: i + 1,
        name: name,
        image: "file.png",
        bg: "#d8f0f7",
        format: "File",
      };
    }
  }
  return labels;
};
