import { useState } from "react";
import "./style.scss";
import { keyArr, rate, guarantee } from "../../constants/const.js";

function App() {
  let reader = new FileReader();

  let [employe, setEmploye] = useState("");
  let [fileData, setFileData] = useState();

  let today = new Date();
  let [year, setYear] = useState(today.getFullYear());
  let [month, setMonth] = useState(today.getMonth());

  function selectFile(e) {
    let file = e.target.files[0];

    if (file) {
      reader.readAsText(file, "UTF-8");
      reader.onprogress = () => console.log(`Читаю файл ${file.name}`);
      reader.onload = () => convertFileToObj(reader.result);
      reader.onloadend = () => console.log(`Файл ${file.name} прочитан.`);
    }
  }

  function convertFileToObj(date) {
    let arr = date.replace(/\"/gi, "").split("\n");
    arr = arr.map((el) => el.split(";"));
    arr.splice(0, 1);
    createObj(arr);
  }

  function createObj(arr) {
    let fileData = {};

    arr.forEach((el) => {
      let obj = {};
      if (el.length > 1) {
        // конвертирую массив в объект
        let j = 0;
        while (j < el.length) {
          obj[keyArr[j]] = el[j];
          j++;
        }

        // добавляю ЗП за полет
        let promo = RegExp("промо", "gi");
        obj.salary = !promo.test(obj.service) && obj.state === "Завершен" ? (obj.duration * rate) / 60 : 0;

        // конвертирую строку даты в объект даты
        let YYYY = obj.flightDate.slice(6, 10);
        let MM = obj.flightDate.slice(3, 5);
        let DD = obj.flightDate.slice(0, 2);
        let HH = obj.flightDate.slice(11, 13);
        let mm = obj.flightDate.slice(14, 16);

        obj.flightDate = new Date(Date.parse(`${YYYY}-${MM}-${DD}T${HH}:${mm}`));

        // заполняю fileData
        YYYY = obj.flightDate.getFullYear();
        MM = obj.flightDate.getMonth();
        DD = obj.flightDate.getDate();

        fileData[YYYY] = fileData[YYYY] ? fileData[YYYY] : {};
        fileData[YYYY][MM] = fileData[YYYY][MM] ? fileData[YYYY][MM] : {};
        fileData[YYYY][MM][DD] = fileData[YYYY][MM][DD] ? fileData[YYYY][MM][DD] : {};

        // считаю ЗП за день без учета гарантии
        fileData[YYYY][MM][DD].salary = fileData[YYYY][MM][DD].salary ? fileData[YYYY][MM][DD].salary : 0;
        fileData[YYYY][MM][DD].salary += obj.salary;

        // добавляю полет в массив полетов внутри дня
        fileData[YYYY][MM][DD].flights = fileData[YYYY][MM][DD].flights ? fileData[YYYY][MM][DD].flights : [];
        fileData[YYYY][MM][DD].flights.push(obj);
      }
    });

    // Добавляю гарантию
    for (let year in fileData) {
      for (let month in fileData[year]) {
        for (let day in fileData[year][month]) {
          let dayMony = fileData[year][month][day].salary;
          fileData[year][month][day].salary = dayMony > 0 && dayMony < guarantee ? guarantee : dayMony;
        }
      }
    }

    setFileData(fileData);

    let year = Object.keys(fileData)[0];
    let month = Object.keys(fileData[year])[0];
    let day = Object.keys(fileData[year][month])[0];

    setYear(year);
    setMonth(month);
    setEmploye(fileData[year][month][day].flights[0].employe);
  }

  return (
    <div className="App">
      <header className="App-header">
        <input type={"file"} onChange={selectFile} />

        {fileData && (
          <h2>
            {employe} {+month + 1}.{year} - {Object.values(fileData[year][month]).reduce((acc, el) => acc + el.salary, 0)} &#8381;
          </h2>
        )}

        {fileData &&
          Object.keys(fileData[year][month]).map((el, i) => (
            <div key={i}>
              <h4>
                {el} - {fileData[year][month][el].salary} &#8381;
              </h4>

              <div>
                {fileData[year][month][el].flights.map((el, i) => (
                  <p>
                    {el.flightDate.getHours()}:{el.flightDate.getMinutes() === 0 ? "00" : el.flightDate.getMinutes()} {el.service}{" "}
                    {el.salary} &#8381;
                  </p>
                ))}
              </div>
            </div>
          ))}
      </header>
    </div>
  );
}

export default App;
