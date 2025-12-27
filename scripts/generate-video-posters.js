const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// 配置
const DATA_JSON_PATH = path.join(__dirname, '../data/data.json');
const POSTER_OUTPUT_DIR = path.join(__dirname, '../assets/images/video/posters');

// 确保输出目录存在
if (!fs.existsSync(POSTER_OUTPUT_DIR)) {
    fs.mkdirSync(POSTER_OUTPUT_DIR, { recursive: true });
    console.log(`创建目录: ${POSTER_OUTPUT_DIR}`);
}

// 截取视频第一帧
async function extractFirstFrame(videoPath, outputPath) {
    const absoluteVideoPath = path.join(__dirname, '..', videoPath.replace('../', ''));
    const absoluteOutputPath = path.join(__dirname, '..', outputPath.replace('../', ''));

    // 检查视频文件是否存在
    if (!fs.existsSync(absoluteVideoPath)) {
        console.error(`视频文件不存在: ${absoluteVideoPath}`);
        return false;
    }

    try {
        // 使用ffmpeg截取第一帧
        // -i: 输入文件
        // -ss 00:00:00: 从0秒开始
        // -vframes 1: 只截取1帧
        // -q:v 2: 高质量（1-31，数字越小质量越高）
        const command = `ffmpeg -i "${absoluteVideoPath}" -ss 00:00:00 -vframes 1 -q:v 2 "${absoluteOutputPath}" -y`;

        await execPromise(command);
        console.log(`✓ 成功生成缩略图: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`✗ 截取失败 ${videoPath}:`, error.message);
        return false;
    }
}

// 主函数
async function main() {
    console.log('开始生成视频缩略图...\n');

    // 读取data.json
    const dataJson = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf-8'));
    let totalVideos = 0;
    let successCount = 0;

    // 遍历所有视频分类
    for (const category of dataJson.videoCategories) {
        console.log(`\n处理分类: ${category.name}`);

        for (const subcategory of category.subcategories || []) {
            console.log(`  子分类: ${subcategory.name}`);

            for (const video of subcategory.videos || []) {
                totalVideos++;

                // 生成缩略图文件名
                const videoFileName = path.basename(video.path, path.extname(video.path));
                const posterFileName = `${videoFileName}.jpg`;
                const posterPath = `../assets/images/video/posters/${posterFileName}`;

                console.log(`  处理视频: ${video.title}`);

                // 截取第一帧
                const success = await extractFirstFrame(video.path, posterPath);

                if (success) {
                    // 添加poster字段到视频对象
                    video.poster = posterPath;
                    successCount++;
                }
            }
        }
    }

    // 保存更新后的data.json
    fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(dataJson, null, 2), 'utf-8');
    console.log(`\n✓ 已更新 data.json`);

    // 输出统计
    console.log(`\n完成！`);
    console.log(`总视频数: ${totalVideos}`);
    console.log(`成功生成: ${successCount}`);
    console.log(`失败: ${totalVideos - successCount}`);
}

// 检查ffmpeg是否安装
async function checkFFmpeg() {
    try {
        await execPromise('ffmpeg -version');
        return true;
    } catch (error) {
        console.error('错误: 未找到 ffmpeg');
        console.error('请先安装 ffmpeg:');
        console.error('  Windows: 从 https://ffmpeg.org/download.html 下载并添加到PATH');
        console.error('  Mac: brew install ffmpeg');
        console.error('  Linux: sudo apt-get install ffmpeg');
        return false;
    }
}

// 运行
checkFFmpeg().then(hasFFmpeg => {
    if (hasFFmpeg) {
        main().catch(error => {
            console.error('发生错误:', error);
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});
