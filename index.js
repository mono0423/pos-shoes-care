const Obniz = require('obniz');
const obniz = new Obniz(process.env.OBNIZ_ID);

obniz.onconnect = async function() {
  const leds = obniz.wired('WS2811', {gnd: 6, vcc: 5, din: 4}); // フルカラーLED
  const speaker = obniz.wired('Speaker', {signal: 2, gnd: 0}); // スピーカー

  obniz.io11.output(true); // 湿度センサーのvcc
  obniz.io10.output(false); // 湿度センサーのgnd

  obniz.io7.output(false); // DCファンのgnd

  while (true) {
    let ave = 0; // 湿度を1秒間におよそ100回測定して、平均を取る
    for (let i = 0; i < 100; i++) {
      const voltage = await obniz.ad9.getWait(); // 湿度センサーのvoutの値を読み取る
      const humid = voltage * 100; // 電圧->湿度の変換(%)
      ave = ave + humid;
      await obniz.wait(10);
    }
    ave = ave / 100; // 100回の平均を取る
    const humid = ave > 100 ? 100 : ave; // 湿度100%以上になる場合、100%にする
    console.log('湿度: ' + humid + ' %');

    let rgb = [0, 0, 255];
    if (humid > 90) {
      rgb = [255, 0, 0]; // LEDを赤色に変更
      obniz.io8.output(true); // DCファンを回す
      speaker.play(1000); // スピーカーを鳴らす
    } else if (humid > 60) {
      rgb = [255, 255, 0]; // LEDを黄色に変更
      obniz.io8.output(true); // DCファンを回す
      speaker.play(800); // スピーカーを鳴らす
    } else {
      rgb = [0, 0, 255]; // LEDを青色に変更
      obniz.io8.output(false); // DCファンを止める
      speaker.play(0); // スピーカーを止める
    }

    leds.rgbs([rgb]); // LEDの色を変える
  }
};
