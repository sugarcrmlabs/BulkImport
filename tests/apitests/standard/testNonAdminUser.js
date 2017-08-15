const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    it('should not be allowed to create Contacts as a regular user', function*() {
        this.timeout(15000);

        this.url = process.env.THORN_SERVER_URL + '/rest/v10/';
        this.userDetails = {
            first_name: 'John',
            last_name: 'Smith',
            user_name: 'jsmith' + parseInt(Math.random() * 999999),
            user_hash: 'jsmith',
            is_admin: 0,
            status: 'Active'
        }

        let response = yield Agent.as(Agent.ADMIN).post('Users', this.userDetails);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.have.lengthOf(36);

        this.userId = response.body.id;

        response = yield chakram.post(this.url + 'oauth2/token',
            {
                'grant_type': 'password',
                'username': this.userDetails.user_name,
                'password': this.userDetails.user_hash,
                'client_id': 'sugar',
                'platform': 'base',
                'client_secret': ''
            },
            {
                headers: {
                    'X-Thorn': 'ManualLogin ' + this.userDetails.user_name
                }
            }
        );

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.access_token).to.not.be.empty;
        expect(response.body.access_token).to.have.lengthOf(36);

        response = yield chakram.post(this.url + 'BulkImport/records/Contacts',
            {
                records: [
                    {
                        first_name: 'Tom',
                        last_name: 'Jones',
                        external_key: 'aaa-bbb-ccc-ddd-eee'
                    }
                ]
            },
            {
                headers: {
                    'X-Thorn': 'ManualBulkContactCreation',
                    'OAuth-Token': response.body.access_token
                }
            }
        );

        expect(response).to.have.status(403);
        expect(response.body.error).to.not.be.empty;
        expect(response.body.error).to.be.equal('not_authorized');
        expect(response.body.error_message).to.not.be.empty;
        expect(response.body.error_message).to.be.equal('BulkImport API requires an Admin user');

        response = yield Agent.as(Agent.ADMIN).delete('Users/' + this.userId);

        expect(response).to.have.status(200);
        expect(response).to.be.an('object');
        expect(response).to.not.be.empty;
        expect(response.body.id).to.not.be.empty;
        expect(response.body.id).to.be.equal(this.userId);
    });
});
