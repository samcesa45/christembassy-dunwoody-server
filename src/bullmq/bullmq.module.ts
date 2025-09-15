import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                const redisConfig = config.get<any>('redis');

                return {
                    connection: {
                        host: redisConfig.host,
                        port: redisConfig.port,
                        password: redisConfig.password,
                        tls: redisConfig.tls,
                        maxRetriesPerRequest: null,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    exports: [BullModule]
})
export class BullmqModule {}
