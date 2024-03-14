/**
 * 海录NVR --> 视频配置菜单栏-->视频页面
 */
export class VideoConfig {
    id: number; // 201
    channelName: string; // 通道号： 导播=201
    audioEnabled: boolean; // true=复合流  false=视频流
    videoResolutionWidth: number; // 分辨率宽
    videoResolutionHeight: number; // 分辨率高
    videoQualityControlType: string; // 码率类型： vbr=可变
    fixedQuality: number; // 图像质量： 90=最高 60=较高
    maxFrameRate: number; // 视频帧率：1800=18帧/秒 2200=22帧/秒
    vbrUpperCap: number; // 可变码率上限：2048
    videoCodecType: string; // 视频编码：H.264

}
