const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    before(function*() {
        this.timeout(5000);
        this.url = process.env.THORN_SERVER_URL + '/rest/v10/';
        let login = yield chakram.post(this.url + 'oauth2/token',
            {
                'grant_type': 'password',
                'username': process.env.THORN_ADMIN_USERNAME,
                'password': process.env.THORN_ADMIN_PASSWORD,
                'client_id': 'sugar',
                'platform': 'base',
                'client_secret': '',
            },
            {
                headers: {
                    'X-Thorn': 'ManualAdminLogin',
                }
            }
        );

        this.token = login.body.access_token;
    });

    it('should throw an error when records parameter is passed as empty as an Admin', function*() {
        this.timeout(15000);

        let response = yield chakram.post(this.url + 'BulkImport/records/Accounts',
            {
                records: []
            },
            {
                headers: {
                    'X-Thorn': 'ManualBulkError',
                    'OAuth-Token': this.token,
                },
            }
        );

        expect(response).to.have.status(422);
        expect(response.body.error).to.not.be.empty;
        expect(response.body.error).to.be.equal('invalid_parameter');
        expect(response.body.error_message).to.not.be.empty;
    });

    it('should throw an error when no parameter is passed as an Admin', function*() {
        this.timeout(15000);

        let response = yield chakram.post(this.url + 'BulkImport/records/Accounts',
            {},
            {
                headers: {
                    'X-Thorn': 'ManualBulkError',
                    'OAuth-Token': this.token,
                },
            }
        );

        expect(response).to.have.status(422);
        expect(response.body.error).to.not.be.empty;
        expect(response.body.error).to.be.equal('invalid_parameter');
        expect(response.body.error_message).to.not.be.empty;
    });
});
