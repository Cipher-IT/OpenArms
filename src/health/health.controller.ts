import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import {HealthCheck} from '@nestjs/terminus';

@Controller('health')
export class HealthController {


@Get()
@HealthCheck()
check() {

    //ToDo: Check supabase here
    return {status: 'ok'};
}

}
