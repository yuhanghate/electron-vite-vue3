import request from './request'
import CryptoJS from "crypto-js";
import {EncodePwdParams} from "@renderer/model/EncodePwdParams"
import {Builder, parseString} from 'xml2js';
import {MixAudioOut} from "@renderer/model/MixAudioOut";
import {AudioOutVlome} from "@renderer/model/AudioOutVlome";
import {Bond} from "@main/utils/model/Bond";
import {Account} from "@renderer/model/Account";
import {NetworkInterface} from "@main/utils/model/NetworkInterface";
import {StorageProgress} from "@main/utils/model/StorageProgress";
import {response} from "express";
import {Track} from "@main/utils/model/Track";

/**
 * 从返回值中提取Cookies
 * @param cookieString
 */
function extractWebSessionSegment(cookieString: string): string | null {
    const webSessionRegex = /WebSession_\w+=\w+/;
    const match = webSessionRegex.exec(cookieString);
    if (match) {
        return match[0];
    } else {
        return null;
    }
}

/**
 * 用户名encode
 * @param username
 */
export function encodeString(username: string): string {
    return username.replace(/&/g, '&amp;').replace(/</g, '&lt').replace(/>/g, '&gt');
}

/**
 * 密码加载
 * @param password
 * @param params
 * @param useEnhancedSecurity
 */
export function encodePwd(password: string, params: EncodePwdParams, useEnhancedSecurity: boolean) {
    let hashedPassword = "";
    if (useEnhancedSecurity) {
        hashedPassword = CryptoJS.SHA256(params.userName + params.salt + password).toString(CryptoJS.enc.Hex);
        hashedPassword = CryptoJS.SHA256(hashedPassword + params.challenge).toString(CryptoJS.enc.Hex);
        for (let n = 2; params.iIterate > n; n++) {
            hashedPassword = CryptoJS.SHA256(hashedPassword).toString(CryptoJS.enc.Hex);
        }
    } else {
        hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex) + params.challenge;
        for (let n = 1; params.iIterate > n; n++) {
            hashedPassword = CryptoJS.SHA256(hashedPassword).toString(CryptoJS.enc.Hex);
        }
    }
    return hashedPassword;
}

/**
 * XML解析成对象
 * @param xmlData
 */
function parseXml(xmlData: string): Promise<any> {
    return new Promise((resolve, reject) => {
        parseString(xmlData, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * xml对象转成字符串
 * @param xmlData
 */
function xmlToString(xmlData: any): string {
    const builder = new Builder();
    return builder.buildObject(xmlData);
}


function generateRandomNumber(length: number): string {
    // 生成一个长度为length的随机数字字符串
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * 打印返回的日志
 * @param responseData
 */
function printResponseLog(responseData: any) {
    let code: string = "";
    let message: string = "";
    if ('SessionUserCheck' in responseData) {
        code = responseData.SessionUserCheck.statusValue[0]
        message = responseData.SessionUserCheck.statusString[0];
    } else if ('ResponseStatus' in responseData) {
        code = responseData.ResponseStatus.statusCode[0];
        message = responseData.ResponseStatus.statusString[0];
    }

    console.log(`code: ${code} message: ${message}`);
}

/**
 * 对外提供的登录接口
 * @param username
 * @param password
 * @param ip
 */
export function login(username: string, password: string, ip: string) {

    return login1(username, password, ip)
        .then(loginData => {
            if (!loginData) {
                console.log('请求失败');
                return
            }

            return parseXml(loginData.data).then(responseData => {

                // 获取登录参数
                let challenge = responseData.SessionLoginCap.challenge[0];
                let salt = responseData.SessionLoginCap.salt[0];
                let iterations = responseData.SessionLoginCap.iterations[0];
                let isSessionIDValidLongTerm = responseData.SessionLoginCap.isSessionIDValidLongTerm[0]._;
                let sessionIDVersion = responseData.SessionLoginCap.sessionIDVersion[0];
                let sessionID = responseData.SessionLoginCap.sessionID[0];

                let params = {
                    "challenge": challenge,
                    "userName": "admin",
                    "salt": salt,
                    "iIterate": iterations
                }

                // 生成密码
                let pwd = encodePwd(password, params, true);

                let body = `
                <SessionLogin>
                    <userName>${encodeString(username)}</userName>
                    <password>${pwd}</password>
                    <sessionID>${sessionID}</sessionID>
                    <isSessionIDValidLongTerm>${isSessionIDValidLongTerm}</isSessionIDValidLongTerm>
                    <sessionIDVersion>${sessionIDVersion}</sessionIDVersion>
                </SessionLogin>
            `
                let url = `http://${ip}/ISAPI/Security/sessionLogin?timeStamp=` + Date.now()
                return login2(ip, body)
                    .then(responseData => {
                        if (!responseData) {
                            console.log('请求失败');
                            return
                        }

                        printResponseLog(responseData);
                        return responseData
                    })

            });
        });

}

/**
 * 登录第一步
 * @param username
 * @param password
 * @param ip
 */
function login1(username: string, password: string, ip: string): Promise<any> {
    const url: string = `http://${username}:${password}@${ip}/ISAPI/Security/sessionLogin/capabilities?username=${username}&random=${generateRandomNumber(8)}`
    return request({
        url: url,
        method: 'GET',
    })
}


/**
 * 登录第二步
 * @param username
 * @param password
 * @param ip
 */
async function login2(ip: string, body: string) {
    let url = `http://${ip}/ISAPI/Security/sessionLogin?timeStamp=${Date.now()}`;

    return request({
        url: url,
        withCredentials: true,
        method: 'post',
        headers: {
            "If-Modified-Since": "0",
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8"
        },
        data: body
    }).then(responseData => {

        let cookie = extractWebSessionSegment(responseData.headers["set-cookie"][0]);
        console.log("cookie", cookie);
        return parseXml(responseData.data)
            .then(data => {
                data.cookie = cookie;
                return data;
            });
    })
}

/**
 * NVR心跳包，维持Cookie
 * @param ip
 * @param cookie
 */
export function sessionHeartbeat(ip: string, cookie: string) {
    const url = `http://${ip}/ISAPI/Security/sessionHeartbeat`;
    // console.log(`${formatTime(new Date(), 'YYYY-MM-DD HH:mm:ss')} 心跳：${url} cookie="${cookie}"`);
    return request({
        url: url,
        withCredentials: false,
        method: 'PUT',
        headers: {
            'Cookie': cookie
        }
    }).then(response => {
        // const resut = parseXml(response.data);
        // log(`${formatTime(new Date(), 'YYYY-MM-DD HH:mm:ss')} sessionHeartbeat结果：${response.data}`);
    });
}

/**
 * 查询硬盘信息
 * @param ip
 * @param cookie
 */
export function getStorageStatus(ip: string, cookie: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/Storage`;
    console.log(`查询硬盘信息: url=${url} cookie=${cookie}`);
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookie
        }
    });
}

/**
 * NVR视频配置-视频第一步
 */
export function configVideo1(ip: string, cookie: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/MirrorStreaming/channels/201`;
    const body = `
    <?xml version="1.0" encoding="UTF-8"?>
<MirrorStreamingChannel xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
    <id>201</id>
    <channelName>201</channelName>
    <enabled>true</enabled>
    <Transport>
        <rtspPortNo>554</rtspPortNo>
        <ControlProtocolList>
            <ControlProtocol>
                <streamingTransport>RTSP</streamingTransport>
            </ControlProtocol>
        </ControlProtocolList>
    </Transport>
    <Audio>
        <enabled>true</enabled>
        <audioInputChannelID>2</audioInputChannelID>
        <audioCompressionType>UNKOWN</audioCompressionType>
    </Audio>
    <Video xmlns="">
        <enabled>true</enabled>
        <dynVideoInputChannelID>2</dynVideoInputChannelID>
        <videoCodecType>H.264</videoCodecType>
        <videoResolutionWidth>1920</videoResolutionWidth>
        <videoScanType>progressive</videoScanType>
        <videoResolutionHeight>1080</videoResolutionHeight>
        <videoQualityControlType>vbr</videoQualityControlType>
        <fixedQuality>90</fixedQuality>
        <vbrUpperCap>2048</vbrUpperCap>
        <maxFrameRate>1800</maxFrameRate>
    </Video>
</MirrorStreamingChannel>
    `
    console.log(`NVR视频配置-视频第一步: url=${url} cookies=${cookie}`);
    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookie,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        data: body
    }).then(response => {
        printResponseLog(response.data);
        return response.data;
    });
}

/**
 * NVR视频配置-视频第二步
 */
export function configVideo2(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/Image/channels/2/imageenhancement`;
    const body = `
    <?xml version="1.0" encoding="UTF-8"?>
<ImageEnhancement
    xmlns="http://www.hikvision.com/ver20/XMLSchema" version="1.0">
    <enabled>true</enabled>
    <ImageEnhancementLevel>5</ImageEnhancementLevel>
</ImageEnhancement>
    `
    console.log(`NVR视频配置-视频第二步: url=${url}} cookies=${cookies}`);


    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookies
        },
        data: body
    }).then(response => {
        printResponseLog(response.data);
        return response.data;
    });
}

/**
 * 混音配置-第一步（本地输出查询）
 */
export function configAudio1(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/System/Audio/AudioOut/channels/17`
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookies
        }
    })
}

/**
 * 混音配置-第二步（本地输出提交）
 */
export function configAudio2(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/System/Audio/AudioOut/channels/17`;

    return configAudio1(ip, cookies)
        .then(response => {
            console.log('configAudio1', response.data);
            return parseXml(response.data);

        })
        .then(response => {
            let MixAudioOutList = response.AudioOut.MixAudioOut
            let AudioOutVlomeList = response.AudioOut.AudioOutVolumelist[0].AudioOutVlome
            for (let i = 0; i < MixAudioOutList.length; i++) {
                let obj = MixAudioOutList[i] as MixAudioOut
                obj.enabled = true;
                obj.outputGain = 900;
                obj.outputMute = false;
                obj.soundQualityHanding = false;
                obj.outputVolume = 0;
            }

            for (let i = 0; i < AudioOutVlomeList.length; i++) {
                let obj = AudioOutVlomeList[i] as AudioOutVlome
                obj.volume = 900;
                obj.type = 'specific';
            }

            let params = xmlToString(response);

            return request({
                url: url,
                method: 'PUT',
                headers: {
                    'Cookie': cookies,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                data: params
            })
        }).then(response => {
            printResponseLog(response.data);
            return parseXml(response.data);
        });
}

/**
 * 混音配置-第三步（录像预览查询）
 * @param ip
 * @param cookies
 */
export function configAudio3(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/System/Audio/AudioOut/channels/25`;
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookies
        }
    })
}

/**
 * 混音配置-第四步（录像预览提交）
 * @param ip
 * @param cookies
 */
export function configAudio4(ip: string, cookies: string): Promise<any> {
    const url = `http://${ip}/ISAPI/System/Audio/AudioOut/channels/25`;
    return configAudio3(ip, cookies)
        .then(response => {
            console.log('configAudio3', response.data);
            return parseXml(response.data);
        })
        .then(response => {
            let MixAudioOutList = response.AudioOut.MixAudioOut[0]
            let AudioOutVlomeList = response.AudioOut.AudioOutVolumelist[0].AudioOutVlome
            for (let i = 0; i < MixAudioOutList.length; i++) {
                let obj = MixAudioOutList[i] as MixAudioOut
                obj.enabled = true;
                obj.outputGain = 8;
                obj.outputMute = false;
                obj.soundQualityHanding = false;
                obj.outputVolume = 6;
            }

            for (let i = 0; i < AudioOutVlomeList.length; i++) {
                let obj = AudioOutVlomeList[i] as AudioOutVlome
                obj.volume = -1000;
                obj.type = 'specific';
            }

            let params = xmlToString(response)
            return request({
                url: url,
                method: 'PUT',
                headers: {
                    'Cookie': cookies
                },
                data: params
            })
        })
        .then(response => {
            printResponseLog(response.data);
            return parseXml(response.data);
        });


}

/**
 * 网络配置-第一步（TCP/IP查询Bond信息）
 * @param ip
 * @param cookies
 */
export function configNet1(ip: string, cookies: string): Promise<any> {
    const url = `http://${ip}/ISAPI/System/Network/Bond/capabilities`;
    console.log(`网络配置-第一步 url=${url}`)
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookies
        }
    }).then(response => {
        return parseXml(response.data);
    });
}

/**
 * 网络配置-第二步（TCP/IP查询interfaces信息）
 * @param ip
 * @param cookies
 */
export function configNet2(ip: string, cookies: string): Promise<any> {
    const url = `http://${ip}/ISAPI/System/Network/interfaces/capabilities`;
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookies
        }
    }).then(response => {
        return parseXml(response.data);
    }).then(response => {
        let list = response.NetworkInterfaceList.NetworkInterface;
        const netList: NetworkInterface[] = [];
        for (let i = 0; i < list.length; i++) {
            let ni = list[i];
            let networkInterface = new NetworkInterface();
            networkInterface.id = ni.id[0];

            // 网络参数配置
            networkInterface.ipAddress.DNSEnable = ni.IPAddress[0].DNSEnable[0]._;
            networkInterface.ipAddress.ipAddress = ni.IPAddress[0].ipAddress[0];
            networkInterface.ipAddress.ipVersion = ni.IPAddress[0].ipVersion[0]._
            networkInterface.ipAddress.addressingType = ni.IPAddress[0].addressingType[0]._;
            networkInterface.ipAddress.subnetMask = ni.IPAddress[0].subnetMask[0];
            networkInterface.ipAddress.ipv6Address = ni.IPAddress[0].ipv6Address[0];
            networkInterface.ipAddress.bitMask = ni.IPAddress[0].bitMask[0];
            networkInterface.ipAddress.defaultGateway.ipAddress = ni.IPAddress[0].DefaultGateway[0].ipAddress[0];
            networkInterface.ipAddress.primaryDNS.ipAddress = ni.IPAddress[0].PrimaryDNS[0].ipAddress[0];
            networkInterface.ipAddress.secondaryDNS.ipAddress = ni.IPAddress[0].SecondaryDNS[0].ipAddress[0];

            // Link配置
            networkInterface.link.MTU = ni.Link[0].MTU[0]._;
            networkInterface.link.duplex = ni.Link[0].duplex[0]._;
            networkInterface.link.speed = ni.Link[0].speed[0]._;
            networkInterface.link.autoNegotiation = ni.Link[0].autoNegotiation[0]._;
            networkInterface.link.MACAddress = ni.Link[0].MACAddress[0];


            if (networkInterface.id == 1) {
                netList[0] = networkInterface;
            } else if (networkInterface.id == 2) {
                netList[1] = networkInterface;
            }
        }
        return netList;
    });
}

/**
 * 网络配置-第三步（TCP/IP提交Bond）
 * @param ip NVR IP地址
 * @param id 网络ID
 * @param cookies 令牌
 * @param primaryDNS 主DNS地址
 * @param secondaryDNS 副DNS地址
 */
export function configNet3(ip: string, account: Account, cookies: string) {


    configNet1(ip, cookies)
        .then(response => {
            let rep = response.BondList.Bond[0];

            let bond = new Bond();
            bond.id = rep.id[0];
            bond.enabled = rep.enabled[0]._;
            bond.primaryIf = rep.primaryIf[0];
            bond.workMode = rep.workMode[0]._;
            bond.ethernetIfId = rep.slaveIfList[0].ethernetIfId[0];
            bond.link.MACAddress = rep.Link[0].MACAddress[0];
            bond.link.MTU = rep.Link[0].MTU[0]._;
            bond.link.speed = rep.Link[0].speed[0]._;
            bond.link.duplex = rep.Link[0].duplex[0]._;
            bond.ipAddress.ipVersion = rep.IPAddress[0].ipAddress[0];
            bond.ipAddress.ipv6Address = rep.IPAddress[0].ipv6Address[0];
            bond.ipAddress.ipAddress = rep.IPAddress[0].ipAddress[0];
            bond.ipAddress.addressingType = rep.IPAddress[0].addressingType[0]._
            bond.ipAddress.bitMask = rep.IPAddress[0].bitMask[0];
            bond.ipAddress.subnetMask = rep.IPAddress[0].subnetMask[0];

            const url = `http://${ip}/ISAPI/System/Network/Bond/${bond.id}`;

            const data = `
                <?xml version="1.0" encoding="UTF-8"?>
                <Bond
                    xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
                    <id>${bond.id}</id>
                    <enabled>${bond.enabled}</enabled>
                    <workMode>${bond.workMode}</workMode>
                    <primaryIf>${bond.primaryIf}</primaryIf>
                    <slaveIfList>
                        <ethernetIfId>${bond.ethernetIfId}</ethernetIfId>
                        <ethernetIfId>${bond.ethernetIfId}</ethernetIfId>
                    </slaveIfList>
                    <IPAddress>
                        <ipVersion>dual</ipVersion>
                        <addressingType>static</addressingType>
                        <ipAddress>${bond.ipAddress.ipAddress}</ipAddress>
                        <subnetMask>255.255.255.0</subnetMask>
                        <ipv6Address>::</ipv6Address>
                        <bitMask>0</bitMask>
                        <Ipv6Mode>
                            <ipV6AddressingType>ra</ipV6AddressingType>
                            <ipv6AddressList></ipv6AddressList>
                        </Ipv6Mode>
                        <DefaultGateway>
                            <ipAddress>0.0.0.0</ipAddress>
                            <ipv6Address>::</ipv6Address>
                        </DefaultGateway>
                        <PrimaryDNS>
                            <ipAddress>${account.primaryDNS}</ipAddress>
                        </PrimaryDNS>
                        <SecondaryDNS>
                            <ipAddress>${account.secondaryDNS}</ipAddress>
                        </SecondaryDNS>
                    </IPAddress>
                    <Discovery>
                        <UPnP>
                            <enabled>false</enabled>
                        </UPnP>
                        <Zeroconf>
                            <enabled>false</enabled>
                        </Zeroconf>
                    </Discovery>
                    <Link>
                        <MACAddress>${bond.link.MACAddress}</MACAddress>
                        <autoNegotiation>${bond.link.autoNegotiation}</autoNegotiation>
                        <speed>${bond.link.speed}</speed>
                        <duplex>${bond.link.duplex}</duplex>
                        <MTU>${bond.link.MTU}</MTU>
                    </Link>
                    <DNSEnable>${bond.enabled}</DNSEnable>
                </Bond>
  `

            return request({
                url: url,
                method: 'PUT',
                headers: {
                    'Cookie': cookies
                },
                data: data
            })
        });


}

export function configNet4(ip: string, cookies: string, account: Account, networkInterface: NetworkInterface) {
    const url = `http://${ip}/ISAPI/System/Network/interfaces/1`;
    const data = `
  <?xml version="1.0" encoding="UTF-8"?>
<NetworkInterface>
    <id>${networkInterface.id}</id>
    <IPAddress>
        <ipVersion>dual</ipVersion>
        <addressingType>static</addressingType>
        <ipAddress>${account.ip}</ipAddress>
        <subnetMask>255.255.255.0</subnetMask>
        <ipv6Address>::</ipv6Address>
        <bitMask>0</bitMask>
        <DefaultGateway>
            <ipAddress>${account.defaultGateway}</ipAddress>
        </DefaultGateway>
        <PrimaryDNS>
            <ipAddress>${account.primaryDNS}</ipAddress>
        </PrimaryDNS>
        <SecondaryDNS>
            <ipAddress>${account.secondaryDNS}</ipAddress>
        </SecondaryDNS>
        <DNSEnable>false</DNSEnable>
    </IPAddress>
    <Link>
        <MACAddress>${networkInterface.link.MACAddress}</MACAddress>
        <autoNegotiation>${networkInterface.link.autoNegotiation}</autoNegotiation>
        <speed>${networkInterface.link.speed}</speed>
        <duplex>${networkInterface.link.duplex}</duplex>
        <MTU>${networkInterface.link.MTU}</MTU>
    </Link>
    <defaultConnection>true</defaultConnection>
</NetworkInterface>
  `

    console.log(`url: \n${url} \n data: \n${data}`)
    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookies
        },
        data: ''
    });
}

export function configNet5(ip: string, cookies: string, networkInterface: NetworkInterface) {
    const url = `http://${ip}/ISAPI/System/Network/interfaces/2`;

    const data = `
  <?xml version="1.0" encoding="UTF-8"?>
<NetworkInterface>
    <id>${networkInterface.id}</id>
    <IPAddress>
        <ipVersion>${networkInterface.ipAddress.ipVersion}</ipVersion>
        <addressingType>${networkInterface.ipAddress.addressingType}</addressingType>
        <ipAddress>${networkInterface.ipAddress.ipAddress}</ipAddress>
        <subnetMask>${networkInterface.ipAddress.subnetMask}</subnetMask>
        <ipv6Address>${networkInterface.ipAddress.ipv6Address}</ipv6Address>
        <bitMask>${networkInterface.ipAddress.bitMask}</bitMask>
        <DefaultGateway>
            <ipAddress>${networkInterface.ipAddress.defaultGateway.ipAddress}</ipAddress>
        </DefaultGateway>
        <PrimaryDNS>
            <ipAddress>${networkInterface.ipAddress.primaryDNS.ipAddress}</ipAddress>
        </PrimaryDNS>
        <SecondaryDNS>
            <ipAddress>${networkInterface.ipAddress.secondaryDNS.ipAddress}</ipAddress>
        </SecondaryDNS>
        <DNSEnable>false</DNSEnable>
    </IPAddress>
    <Link>
        <MACAddress>${networkInterface.link.MACAddress}</MACAddress>
        <autoNegotiation>${networkInterface.link.autoNegotiation}</autoNegotiation>
        <speed>${networkInterface.link.speed}</speed>
        <duplex>${networkInterface.link.duplex}</duplex>
        <MTU>${networkInterface.link.MTU}</MTU>
    </Link>
    <defaultConnection>false</defaultConnection>
</NetworkInterface>
  `
    console.log(`url: \n${url} \n data: \n${data}`)
    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookies
        },
        data: data
    });
}

/**
 * NVR硬盘管理-格式化第一步
 * @param ip
 * @param cookies
 */
export function configStorage1(ip: string, cookies: string) {

    const url = `http://${ip}/ISAPI/ContentMgmt/Storage/hdd/1/format`;
    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookies
        }
    })
}

export function configStorage2(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/Storage/hdd/1/formatStatus`;
    return request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': cookies
        }
    }).then(response => {
        console.log(response.data)
        return parseXml(response.data);
    }).then(response => {
        let storageProgress = new StorageProgress();
        storageProgress.formating = response.formatStatus.formating[0];
        storageProgress.percent = response.formatStatus.percent[0];

        return storageProgress;
    });

}

/**
 * 通道管理-第一步（通道接入配置）
 * @param ip
 * @param cookies
 */
export function configChannel1(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/RecordingHost/hostParam`;
    const data = `
        <?xml version="1.0" encoding="UTF-8"?>
        <hostParam
            xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
            <oneKeyDefaultDelay>5</oneKeyDefaultDelay>
            <courseDataStorageEnabled>true</courseDataStorageEnabled>
            <electronicEnlargeMode>true</electronicEnlargeMode>
            <systemMode>no</systemMode>
            <StreamAccess>
                <studentTrackCamera>main</studentTrackCamera>
                <teacherTrackCamera>third</teacherTrackCamera>
            </StreamAccess>
            <courseLiveView>false</courseLiveView>
        </hostParam>
    `;
    return request({
        url: url,
        method: 'PUT',
        headers: {
            'Cookie': cookies
        },
        data: data
    })
}

/**
 * 通道管理-第二步（录像计划）
 * @param ip
 * @param cookies
 */
export function configChannel2(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/record/tracks`;

    return request({
        url: url,
        method: "GET",
        headers: {
            'Cookie': cookies
        }
    }).then(response => {
        console.log(`${response.data}`);
        return parseXml(response.data);
    }).then(response => {
        const trackList = response.TrackList.Track;
        console.log(`trackList.length = ${trackList.length}`);
        let list: Track[] = [];
        for (let i = 0; i < trackList.length; i++) {
            const track = trackList[i];
            const obj = new Track();
            obj.id = track.id[0];
            obj.Channel = track.Channel[0];
            obj.Enable = track.Enable[0];
            obj.Description = track.Description[0];
            obj.TrackGUID = track.TrackGUID[0];
            obj.Size = track.Size[0];
            obj.Duration = track.Duration[0]._;
            obj.DefaultRecordingMode = track.DefaultRecordingMode[0];
            obj.SrcDescriptor.SrcGUID = track.SrcDescriptor[0].SrcGUID[0];
            obj.SrcDescriptor.SrcChannel = track.SrcDescriptor[0].SrcChannel[0];
            obj.SrcDescriptor.SrcUrl = track.SrcDescriptor[0].SrcUrl[0];
            obj.CustomExtensionList.CustomExtension.CustomExtensionName = track.CustomExtensionList[0].CustomExtension[0].CustomExtensionName[0];
            obj.CustomExtensionList.CustomExtension.enableSchedule = track.CustomExtensionList[0].CustomExtension[0].enableSchedule[0];
            obj.CustomExtensionList.CustomExtension.SaveAudio = track.CustomExtensionList[0].CustomExtension[0].SaveAudio[0];
            obj.CustomExtensionList.CustomExtension.PreRecordTimeSeconds = track.CustomExtensionList[0].CustomExtension[0].PreRecordTimeSeconds[0];
            obj.CustomExtensionList.CustomExtension.PostRecordTimeSeconds = track.CustomExtensionList[0].CustomExtension[0].PostRecordTimeSeconds[0];
            obj.CustomExtensionList.CustomExtension.HolidaySchedule.ScheduleBlock.ScheduleBlockGUID = track.CustomExtensionList[0].CustomExtension[0].HolidaySchedule[0].ScheduleBlock[0].ScheduleBlockGUID[0];
            obj.CustomExtensionList.CustomExtension.HolidaySchedule.ScheduleBlock.ScheduleBlockType = track.CustomExtensionList[0].CustomExtension[0].HolidaySchedule[0].ScheduleBlock[0].ScheduleBlockType[0];
            list[i] = obj;
        }

        return list;
    });
}

export function configChannel3(ip: string, cookies: string) {
    const url = `http://${ip}/ISAPI/ContentMgmt/record/tracks`;

    return configChannel2(ip, cookies)
        .then(response => {

            console.log(`track[] 长度：${response.length}`);
            let trackListXml: String = "";

            for (let i: number = 0; i < response.length; i++) {
                const track: Track = response[i];
                const trackXml: string = `
                <Track>
                    <id>${track.id}</id>
                    <Channel>${track.Channel}</Channel>
                    <Enable>${track.Enable}</Enable>
                    <Description>${track.Description}</Description>
                    <TrackGUID>${track.TrackGUID}</TrackGUID>
                    <Size>${track.Size}</Size>
                    <Duration min="0" max="750">${track.Duration}</Duration>
                    <DefaultRecordingMode>${track.DefaultRecordingMode}</DefaultRecordingMode>
                    <SrcDescriptor>
                        <SrcGUID>${track.SrcDescriptor.SrcGUID}</SrcGUID>
                        <SrcChannel>${track.SrcDescriptor.SrcChannel}</SrcChannel>
                        <StreamHint></StreamHint>
                        <SrcDriver></SrcDriver>
                        <SrcType></SrcType>
                        <SrcUrl>${track.SrcDescriptor.SrcUrl}</SrcUrl>
                        <SrcUrlMethods></SrcUrlMethods>
                        <SrcLogin></SrcLogin>
                    </SrcDescriptor>
                    <TrackSchedule>
                        <ScheduleBlockList>
                            <ScheduleBlock>
                                <ScheduleBlockGUID>{00000000-0000-0000-0000-000000000000}</ScheduleBlockGUID>
                                <ScheduleBlockType>www.std-cgi.com/racm/schedule/ver10</ScheduleBlockType>
                                <ScheduleAction>
                                    <id>1</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Monday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Monday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>2</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Tuesday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Tuesday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>3</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Wednesday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Wednesday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>4</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Thursday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Thursday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>5</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Friday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Friday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>6</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Saturday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Saturday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                                <ScheduleAction>
                                    <id>7</id>
                                    <ScheduleActionStartTime>
                                        <DayOfWeek>Sunday</DayOfWeek>
                                        <TimeOfDay>07:30:00</TimeOfDay>
                                    </ScheduleActionStartTime>
                                    <ScheduleActionEndTime>
                                        <DayOfWeek>Sunday</DayOfWeek>
                                        <TimeOfDay>22:00:00</TimeOfDay>
                                    </ScheduleActionEndTime>
                                    <ScheduleDSTEnable>false</ScheduleDSTEnable>
                                    <Description>nothing</Description>
                                    <Actions>
                                        <Record>true</Record>
                                        <Log>false</Log>
                                        <SaveImg>false</SaveImg>
                                        <ActionRecordingMode>CMR</ActionRecordingMode>
                                    </Actions>
                                </ScheduleAction>
                            </ScheduleBlock>
                        </ScheduleBlockList>
                    </TrackSchedule>
                    <CustomExtensionList>
                        <CustomExtension>
                            <CustomExtensionName>${track.CustomExtensionList.CustomExtension.CustomExtensionName}</CustomExtensionName>
                            <enableSchedule>${track.CustomExtensionList.CustomExtension.enableSchedule}</enableSchedule>
                            <SaveAudio>${track.CustomExtensionList.CustomExtension.SaveAudio}</SaveAudio>
                            <PreRecordTimeSeconds>${track.CustomExtensionList.CustomExtension.PreRecordTimeSeconds}</PreRecordTimeSeconds>
                            <PostRecordTimeSeconds>${track.CustomExtensionList.CustomExtension.PostRecordTimeSeconds}</PostRecordTimeSeconds>
                            <HolidaySchedule>
                                <ScheduleBlock>
                                    <ScheduleBlockGUID>${track.CustomExtensionList.CustomExtension.HolidaySchedule.ScheduleBlock.ScheduleBlockGUID}</ScheduleBlockGUID>
                                    <ScheduleBlockType>${track.CustomExtensionList.CustomExtension.HolidaySchedule.ScheduleBlock.ScheduleBlockType}</ScheduleBlockType>
                                </ScheduleBlock>
                            </HolidaySchedule>
                        </CustomExtension>
                    </CustomExtensionList>
                </Track>
                `;

                trackListXml += trackXml;
            }

            const data: string = `
            <?xml version="1.0" encoding="UTF-8" ?>
            <TrackList version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
                ${trackListXml}
            </TrackList>
            `

            console.log(`url: \n${url} \n data: \n${data}`);

            return data;
            // return request({
            //     url: url,
            //     method: "PUT",
            //     headers: {
            //         'Cookie': cookies
            //     },
            //     data: data,
            // });
        })

}


