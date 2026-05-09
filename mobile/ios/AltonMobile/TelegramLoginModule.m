#import <React/RCTBridgeModule.h>

@interface TelegramLoginModule : NSObject <RCTBridgeModule>
@end

@implementation TelegramLoginModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(login:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  reject(@"E_TELEGRAM_SDK", @"Integrate Telegram Login iOS SDK (SPM) and return id_token — see mobile/README.md. Backend: POST /api/login/telegram-sdk.", nil);
}

@end
